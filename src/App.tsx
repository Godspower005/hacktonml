import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Landing from './pages/Landing';
import InfoSheet from './pages/seeker/InfoSheet';
import NeedsProfilePage from './pages/seeker/NeedsProfile';
import Matches from './pages/seeker/Matches';
import ListingDetail from './pages/ListingDetail';
import ListProperty from './pages/landlord/ListProperty';
import FeesAndTerms from './pages/landlord/FeesAndTerms';
import FeeBreakdownPage from './pages/landlord/FeeBreakdown';
import Published from './pages/landlord/Published';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/seeker" element={<InfoSheet />} />
        <Route path="/seeker/needs" element={<NeedsProfilePage />} />
        <Route path="/seeker/matches" element={<Matches />} />
        <Route path="/listing/:id" element={<ListingDetail />} />
        <Route path="/landlord" element={<ListProperty />} />
        <Route path="/landlord/fees" element={<FeesAndTerms />} />
        <Route path="/landlord/preview" element={<FeeBreakdownPage />} />
        <Route path="/landlord/publish" element={<Published />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
