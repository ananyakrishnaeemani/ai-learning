import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Roadmap from './pages/Roadmap';
import LearningSession from './pages/LearningSession';
import Progress from './pages/Progress';
import Profile from './pages/Profile';
import ChatMentor from './pages/ChatMentor';
import MockExamConfig from './pages/MockExamConfig';
import MockExamSession from './pages/MockExamSession';
import ReviewMockExam from './pages/ReviewMockExam';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <Layout>
      {children}
    </Layout>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/roadmap/:topicId" element={
        <ProtectedRoute>
          <Roadmap />
        </ProtectedRoute>
      } />
      <Route path="/learn/:moduleId" element={
        <ProtectedRoute>
          <LearningSession />
        </ProtectedRoute>
      } />
      <Route path="/progress" element={
        <ProtectedRoute>
          <Progress />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/chat" element={
        <ProtectedRoute>
          <ChatMentor />
        </ProtectedRoute>
      } />
      <Route path="/mock-exam" element={
        <ProtectedRoute>
          <MockExamConfig />
        </ProtectedRoute>
      } />
      <Route path="/mock-exam-session/:examId" element={
        <ProtectedRoute>
          {/* Mock Exam Session takes over screen, maybe don't wrap in layout? 
              User requested layout for specific tabs. 
              Usually sessions are fullscreen. Let's keep it in layout for now or make it fullscreen without nav? 
              Actually, usually exam sessions are distraction free.
              But "Mock Exam Config" definitely needs Layout.
              MockExamSession has "Full Screen" button internally. 
              Let's Wrap it.
          */}
          <MockExamSession />
        </ProtectedRoute>
      } />
      <Route path="/mock-exam-review/:attemptId" element={
        <ProtectedRoute>
          <ReviewMockExam />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
