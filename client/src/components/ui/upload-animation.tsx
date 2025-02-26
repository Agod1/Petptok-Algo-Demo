import { motion } from "framer-motion";
import { Upload, CheckCircle, XCircle } from "lucide-react";

interface UploadAnimationProps {
  status: "idle" | "uploading" | "success" | "error";
  progress?: number;
}

export function UploadAnimation({ status, progress = 0 }: UploadAnimationProps) {
  return (
    <div className="relative flex items-center justify-center h-20">
      {status === "idle" && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-muted-foreground"
        >
          <Upload className="h-10 w-10" />
        </motion.div>
      )}
      
      {status === "uploading" && (
        <div className="relative">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
            <svg className="w-12 h-12" viewBox="0 0 50 50">
              <motion.circle
                cx="25"
                cy="25"
                r="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${progress * 125.6} 125.6`}
                className="text-primary"
              />
              <Upload className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
            </svg>
          </motion.div>
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <svg className="w-12 h-12" viewBox="0 0 50 50">
              <circle
                cx="25"
                cy="25"
                r="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray="12.56 125.6"
                className="text-primary/30"
              />
            </svg>
          </motion.div>
        </div>
      )}
      
      {status === "success" && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-green-500"
        >
          <CheckCircle className="h-10 w-10" />
        </motion.div>
      )}
      
      {status === "error" && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-destructive"
        >
          <XCircle className="h-10 w-10" />
        </motion.div>
      )}
    </div>
  );
}
