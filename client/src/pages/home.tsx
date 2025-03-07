import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Upload, User, Users, AlertTriangle, Briefcase, Target, Book, Lightbulb, Building2, Factory, MapPin } from "lucide-react";
import Papa from "papaparse";
import type { Mentor, Mentee, MatchWeights } from "@shared/schema";
// import { findBestMatches } from "@/lib/matching";
import { UploadAnimation } from "@/components/ui/upload-animation";
import { MBTI_PAIRINGS } from "../lib/config";

const REQUIRED_MENTOR_FIELDS = ['last_work_role', 'skills', 'experience', 'industry_specific_needs'];
const REQUIRED_MENTEE_FIELDS = ['last_work_role', 'career_goals', 'preferred_skills', 'experience', 'industry_specific_needs'];

type UploadStatus = "idle" | "uploading" | "success" | "error";
type MatchResult = Mentor & { matchScore: number };

function validateCSVData(data: Record<string, string>[], requiredFields: string[]): string | null {
  if (!data || data.length === 0) {
    return "The CSV file appears to be empty";
  }

  const missingFields = requiredFields.filter(field => !Object.keys(data[0]).includes(field));
  if (missingFields.length > 0) {
    return `Missing required fields: ${missingFields.join(", ")}`;
  }

  // Validate that required fields are not empty
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    for (const field of requiredFields) {
      if (!row[field] || row[field].trim() === '') {
        return `Row ${i + 1} has an empty ${field}`;
      }

      // Validate max_match is a number for mentors
      if (field === 'max_match' && isNaN(parseInt(row[field]))) {
        return `Row ${i + 1} has an invalid max_match value. Must be a number.`;
      }

      // Validate comma-separated lists
      if (['skills', 'interests', 'industry_specific_needs', 'career_goals', 'preferred_skills'].includes(field)) {
        const values = row[field].split(',');
        if (values.length === 0 || values.every(v => v.trim() === '')) {
          return `Row ${i + 1} has an invalid ${field} list. Must be comma-separated values.`;
        }
      }
    }
  }

  return null;
}

export default function Home() {
  const { toast } = useToast();
  const [selectedMentees, setSelectedMentees] = useState<Set<number>>(new Set());
  const [mentorUploadStatus, setMentorUploadStatus] = useState<UploadStatus>("idle");
  const [menteeUploadStatus, setMenteeUploadStatus] = useState<UploadStatus>("idle");
  const [weights, setWeights] = useState<MatchWeights>({
    skills: 0.5,
    location: 0.2,
    experience: 0.3,
    industryNeeds: 0.4,
    mbti: 0.3
  });

  const { data: mentors = [] } = useQuery<Mentor[]>({ 
    queryKey: ["/api/mentors"]
  });

  const { data: mentees = [] } = useQuery<Mentee[]>({
    queryKey: ["/api/mentees"]
  });

  const uploadMentors = useMutation({
    mutationFn: async (data: Record<string, string>[]) => {
      setMentorUploadStatus("uploading");
      await apiRequest("DELETE", "/api/mentors");
      for (const mentor of data) {
        await apiRequest("POST", "/api/mentors", {
          ...mentor,
          skills: mentor.skills.split(",").map((s: string) => s.trim()),
          interests: mentor.interests.split(",").map((s: string) => s.trim()),
          industry_specific_needs: mentor.industry_specific_needs.split(",").map((s: string) => s.trim()),
          max_match: parseInt(mentor.max_match)
        });
      }
    },
    onSuccess: () => {
      setMentorUploadStatus("success");
      queryClient.invalidateQueries({ queryKey: ["/api/mentors"] });
      toast({ 
        title: "Success", 
        description: "Mentor data uploaded successfully",
      });
      setTimeout(() => setMentorUploadStatus("idle"), 2000);
    },
    onError: (error) => {
      setMentorUploadStatus("error");
      toast({ 
        title: "Error", 
        description: "Failed to upload mentor data. Please check the console for details.",
        variant: "destructive"
      });
      console.error("Mentor upload error:", error);
      setTimeout(() => setMentorUploadStatus("idle"), 2000);
    }
  });

  const uploadMentees = useMutation({
    mutationFn: async (data: Record<string, string>[]) => {
      setMenteeUploadStatus("uploading");
      await apiRequest("DELETE", "/api/mentees");
      for (const mentee of data) {
        await apiRequest("POST", "/api/mentees", {
          ...mentee,
          career_goals: mentee.career_goals.split(",").map((s: string) => s.trim()),
          preferred_skills: mentee.preferred_skills.split(",").map((s: string) => s.trim()),
          interests: mentee.interests.split(",").map((s: string) => s.trim()),
          industry_specific_needs: mentee.industry_specific_needs.split(",").map((s: string) => s.trim())
        });
      }
    },
    onSuccess: () => {
      setMenteeUploadStatus("success");
      queryClient.invalidateQueries({ queryKey: ["/api/mentees"] });
      toast({ 
        title: "Success", 
        description: "Mentee data uploaded successfully",
      });
      setTimeout(() => setMenteeUploadStatus("idle"), 2000);
    },
    onError: (error) => {
      setMenteeUploadStatus("error");
      toast({ 
        title: "Error", 
        description: "Failed to upload mentee data. Please check the console for details.",
        variant: "destructive"
      });
      console.error("Mentee upload error:", error);
      setTimeout(() => setMenteeUploadStatus("idle"), 2000);
    }
  });

  const handleFileUpload = (file: File, type: "mentors" | "mentees") => {
    if (!file) {
      toast({ 
        title: "Error", 
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    if (!file.name.endsWith('.csv')) {
      toast({ 
        title: "Error", 
        description: "Please upload a CSV file",
        variant: "destructive"
      });
      return;
    }

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Check for parsing errors
        if (results.errors.length > 0) {
          const errorMessage = results.errors
            .map(err => `Row ${err.row + 1}: ${err.message}`)
            .join('\n');
          toast({ 
            title: "CSV Parse Error", 
            description: `Failed to parse CSV file:\n${errorMessage}`,
            variant: "destructive"
          });
          return;
        }

        // Validate data structure
        const error = validateCSVData(
          results.data, 
          type === "mentors" ? REQUIRED_MENTOR_FIELDS : REQUIRED_MENTEE_FIELDS
        );

        if (error) {
          toast({ 
            title: "Validation Error", 
            description: error,
            variant: "destructive"
          });
          return;
        }

        // Proceed with upload if validation passes
        if (type === "mentors") {
          uploadMentors.mutate(results.data);
        } else {
          uploadMentees.mutate(results.data);
        }
      },
      error: (error) => {
        toast({ 
          title: "Error", 
          description: `Failed to parse CSV file: ${error.message}`,
          variant: "destructive"
        });
      }
    });
  };

  const getMatchesForMentee = (mentee: Mentee) => {
    console.log('mentee', mentee)
    return mentors.map(match => ({
      ...match,
      matchScore: calculateMatchScore(match, mentee, weights)
    }));
  };

  const calculateMatchScore = (mentor: Mentor, mentee: Mentee, weights: MatchWeights): number => {
    // Skills match percentage
    const skillsMatch = (() => {    
        const commonSkills = mentor.skills.filter(skill => mentee.preferred_skills.includes(skill)).length;
        const totalSkills = mentee.preferred_skills.length || 1; // Prevent division by zero

        return (commonSkills / totalSkills) * weights.skills;
    })();

    // experience level match (binary match)
    const experienceMatch = mentor.experience > mentee.experience ? weights.experience : 0;

    // Industry-specific needs match (binary match)
    const industryMatch = mentor.industry_specific_needs.some(need => mentee.industry_specific_needs.includes(need)) 
        ? weights.industryNeeds 
        : 0;

    // MBTI match percentage
    const mbtiMatch = (() => {   
        let score = 0;

        if (mentee.mbti in MBTI_PAIRINGS) {
            const pairings = MBTI_PAIRINGS[mentee.mbti];
            const mentorMBTIIndex = pairings.indexOf(mentor.mbti);

            if (mentorMBTIIndex !== -1) {
                score += ((3 - mentorMBTIIndex) / 3) * weights.mbti;
            }
        }

        return score;
    })();

    // Location match (binary match)
    const locationMatch = mentor.location === mentee.location ? weights.location : 0;

    // Calculate Total Match Percentage
    const totalScore = skillsMatch + experienceMatch + industryMatch + mbtiMatch + locationMatch;
    const maxPossibleScore = weights.skills + weights.experience + weights.industryNeeds + weights.mbti + weights.location;

    return (totalScore / maxPossibleScore); // Convert to percentage
};


  const renderSkillBadges = (skills: string[]) => {
    if (skills) {
          return (
      <div className="flex flex-wrap gap-1 mt-1">
        {skills.map((skill, index) => (
          <Badge key={index} variant="secondary" className="text-xs">
            {skill}
          </Badge>
        ))}
      </div>
    );
    }
    return (<div className="flex flex-wrap gap-1 mt-1"></div>)
  };

  const renderMatchScore = (score: number) => {
    const percentage = Math.round((score || 0) * 100);
  
    const getColor = (type: "bg" | "text") => {
      if (percentage >= 90) return type === "bg" ? "bg-green-600" : "text-green-600";
      if (percentage >= 80) return type === "bg" ? "bg-green-500" : "text-green-500";
      if (percentage >= 70) return type === "bg" ? "bg-green-400" : "text-green-400";
      if (percentage >= 60) return type === "bg" ? "bg-yellow-600" : "text-yellow-600";
      if (percentage >= 50) return type === "bg" ? "bg-yellow-400" : "text-yellow-400";
      if (percentage >= 40) return type === "bg" ? "bg-orange-500" : "text-orange-500";
      if (percentage >= 30) return type === "bg" ? "bg-orange-400" : "text-orange-400";
      return type === "bg" ? "bg-red-600" : "text-red-600";
    };
    
    
  
    return (
      <div className="flex items-center gap-3">
        {/* Bigger & Bolder Score Text */}
        <div className="text-lg font-bold">
          <span className={`${getColor("text")}`}>{percentage}%</span>{" "}
          <span className="text-gray-700">Match</span>
        </div>
  
        {/* Enlarged Progress Bar */}
        <div className="h-4 w-32 bg-gray-200 rounded-full overflow-hidden shadow-md">
          <div
            className={`h-full transition-all duration-500 ${getColor("bg")}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };
  
  
  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Mentors CSV</label>
              <div className="space-y-2">
                <Input 
                  type="file" 
                  accept=".csv"
                  disabled={uploadMentors.isPending}
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "mentors")}
                />
                <UploadAnimation status={mentorUploadStatus} progress={0.5} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Mentees CSV</label>
              <div className="space-y-2">
                <Input 
                  type="file" 
                  accept=".csv"
                  disabled={uploadMentees.isPending}
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "mentees")}
                />
                <UploadAnimation status={menteeUploadStatus} progress={0.5} />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">Required fields:</p>
              <p><strong>Mentors:</strong> {REQUIRED_MENTOR_FIELDS.map(field => field.replace(/_/g, " ")).join(", ")}</p>
              <p><strong>Mentees:</strong> {REQUIRED_MENTEE_FIELDS.map(field => field.replace(/_/g, " ")).join(", ")}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
  <CardHeader>
    <CardTitle>Match Weights</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {Object.entries(weights).map(([key, value]) => (
      <div key={key} className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium capitalize">
            {key.replace(/([A-Z])/g, " $1")}
          </label>
          <span className="text-sm font-medium text-muted-foreground">
            {(value*5).toFixed(0)}
          </span>
        </div>
        <Slider
          value={[value]}
          min={0}
          max={1}
          step={0.2}
          onValueChange={([newValue]) =>
            setWeights(w => ({ ...w, [key]: newValue }))
          }
        />
      </div>
    ))}
  </CardContent>
</Card>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Mentees
            </CardTitle>
            <CardDescription>
              Select mentees to view their best mentor matches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              {mentees.map(mentee => (
                <div key={mentee.id} className="flex items-start space-x-4 p-4 hover:bg-muted/50 rounded-lg transition-colors">
                  <Checkbox
                    checked={selectedMentees.has(mentee.id)}
                    onCheckedChange={(checked) => {
                      const newSelected = new Set(selectedMentees);
                      if (checked) {
                        newSelected.add(mentee.id);
                      } else {
                        newSelected.delete(mentee.id);
                      }
                      setSelectedMentees(newSelected);
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{mentee.name}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">{mentee.last_work_role}</div>
                    <div className="mt-2 space-y-2">

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Target className="h-4 w-4" />
                      <span>Career Goals:</span>
                    </div>
                    {renderSkillBadges(mentee.career_goals)}

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Book className="h-4 w-4" />
                      <span>Preferred Skills:</span>
                    </div>
                    {renderSkillBadges(mentee.preferred_skills)}

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>Years of Experience:</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {mentee?.experience}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Factory className="h-4 w-4" />
                      <span>Industry-Specific Needs:</span>
                    </div>
                    {renderSkillBadges(mentee.industry_specific_needs)}

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>Location:</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {mentee?.location}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>MBTI:</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {mentee?.mbti}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Ideal Mentor's MBTI:</span>
                    </div>
                    {renderSkillBadges(MBTI_PAIRINGS[mentee.mbti])}
                  </div>

                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Matches</CardTitle>
            <CardDescription>
              Top 3 mentor matches for selected mentees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              {Array.from(selectedMentees).map(menteeId => {
                console.log('selectedMentees', selectedMentees);
                const mentee = mentees.find(m => m.id === menteeId);
                if (!mentee) return null;

                const matches: MatchResult[] = getMatchesForMentee(mentee);
                return (
                  <div key={menteeId} className="mb-6 last:mb-0">
                    <div className="flex items-center gap-2 mb-4">
                      <Briefcase className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">
                        Matches for {mentee.name}
                      </h3>
                      <div className="text-sm text-muted-foreground">{mentee.last_work_role}</div>
                    </div>

                    <div className="space-y-4">
                      {matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3).map((mentor, index) => (
                        <div 
                          key={mentor.id} 
                          className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="font-medium text-lg">{mentor.name}</div>
                                <div className="text-sm text-muted-foreground">{mentor.last_work_role}</div>
                              </div>
                            </div>
                            {renderMatchScore(mentor.matchScore)}
                          </div>

                          <Separator className="my-3" />

                          <div className="space-y-3">

                              <div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                  <Factory className="h-4 w-4" />
                                  <span>Industry Experience:</span>
                                </div>
                                {renderSkillBadges(mentor.industry_specific_needs)}
                              </div>

                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Building2 className="h-4 w-4" />
                                <span>Years of Experience:</span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {mentor?.experience}
                                </Badge>
                              </div>

                              <div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                  <Book className="h-4 w-4" />
                                  <span>Skills:</span>
                                </div>
                                {renderSkillBadges(mentor.skills)}
                              </div>

                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>Location:</span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {mentor?.location}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>MBTI:</span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {mentor?.mbti}
                                </Badge>
                              </div>
                            </div>

                            
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}