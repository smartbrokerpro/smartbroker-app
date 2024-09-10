import { useSession } from 'next-auth/react';
import ProjectQuickEditor from '@/components/ProjectQuickEditor';
import { Box } from '@mui/material';

export default function ProjectEditorPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Loading...</p>
  }

  if (status === "unauthenticated") {
    return <p>Access Denied</p>
  }

  return (
    <Box sx={{p:4}}>
      <ProjectQuickEditor />
    </Box>
  )
}