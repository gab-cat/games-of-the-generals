import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Home, ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/button'

function NotFoundComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="text-8xl font-bold text-white/20"
        >
          404
        </motion.div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white/90">Page Not Found</h1>
          <p className="text-white/60">The page you're looking for doesn't exist.</p>
        </div>
        
        <div className="flex gap-4 justify-center">
          <Button
            asChild
            variant="outline"
            className="bg-white/10 border-white/20 text-white/90 hover:bg-white/20"
          >
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Back to Lobby
            </Link>
          </Button>
          
          <Button
            onClick={() => window.history.back()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export const Route = createFileRoute('/$')({
  component: NotFoundComponent,
})
