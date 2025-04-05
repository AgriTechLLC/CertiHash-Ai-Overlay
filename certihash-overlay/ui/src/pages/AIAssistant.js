import React from 'react';
import { Box, Container } from '@mui/material';
import Layout from '../components/Layout';
import AIDashboard from '../components/ai/AIDashboard';

const AIAssistant = () => {
  return (
    <Layout>
      <Container maxWidth="xl">
        <Box sx={{ flexGrow: 1 }}>
          <AIDashboard />
        </Box>
      </Container>
    </Layout>
  );
};

export default AIAssistant;