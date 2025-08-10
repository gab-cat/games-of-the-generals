import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { AvatarUpload } from "./AvatarUpload";

interface AvatarSectionProps {
  username: string;
  currentAvatarUrl?: string;
  rank: string;
}

export function AvatarSection({ username, currentAvatarUrl, rank }: AvatarSectionProps) {
  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Avatar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AvatarUpload 
            username={username}
            currentAvatarUrl={currentAvatarUrl}
            rank={rank}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
