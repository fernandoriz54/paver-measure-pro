import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Dashboard from '@/pages/Dashboard';
import MeasurementGuide from '@/pages/MeasurementGuide';
import HowToMeasure from '@/pages/HowToMeasure';
import NewProject from '@/pages/projects/NewProject';
import Projects from '@/pages/projects/Projects';
import ProjectDetail from '@/pages/projects/ProjectDetail';
import RectangleCalc from '@/pages/calculators/RectangleCalc';
import CircleCalc from '@/pages/calculators/CircleCalc';
import TriangleCalc from '@/pages/calculators/TriangleCalc';
import PaverCalc from '@/pages/calculators/PaverCalc';
import TurfCalc from '@/pages/calculators/TurfCalc';
import DrivewayCalc from '@/pages/calculators/DrivewayCalc';
import WalkwayCalc from '@/pages/calculators/WalkwayCalc';
import LawnCalc from '@/pages/calculators/LawnCalc';
import StepsCalc from '@/pages/calculators/StepsCalc';
import BorderCalc from '@/pages/calculators/BorderCalc';
import IrregularCalc from '@/pages/calculators/IrregularCalc';
import MaterialCalc from '@/pages/calculators/MaterialCalc';
import UnitConverter from '@/pages/calculators/UnitConverter';
import CombinedCalc from '@/pages/calculators/CombinedCalc';
import EntranceCalc from '@/pages/calculators/EntranceCalc';
import ProductLibrary from '@/pages/ProductLibrary';
import EstimateBuilder from '@/pages/EstimateBuilder';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/guide" element={<MeasurementGuide />} />
        <Route path="/how-to" element={<HowToMeasure />} />
        <Route path="/projects/new" element={<NewProject />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/calc/rectangle" element={<RectangleCalc />} />
        <Route path="/calc/circle" element={<CircleCalc />} />
        <Route path="/calc/triangle" element={<TriangleCalc />} />
        <Route path="/calc/paver" element={<PaverCalc />} />
        <Route path="/calc/turf" element={<TurfCalc />} />
        <Route path="/calc/driveway" element={<DrivewayCalc />} />
        <Route path="/calc/walkway" element={<WalkwayCalc />} />
        <Route path="/calc/lawn" element={<LawnCalc />} />
        <Route path="/calc/steps" element={<StepsCalc />} />
        <Route path="/calc/border" element={<BorderCalc />} />
        <Route path="/calc/irregular" element={<IrregularCalc />} />
        <Route path="/calc/material" element={<MaterialCalc />} />
        <Route path="/calc/converter" element={<UnitConverter />} />
        <Route path="/calc/combined" element={<CombinedCalc />} />
        <Route path="/calc/entrance" element={<EntranceCalc />} />
        <Route path="/products" element={<ProductLibrary />} />
        <Route path="/builder" element={<EstimateBuilder />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App