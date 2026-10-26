'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Search,
  PlusCircle,
  FileQuestion,
} from 'lucide-react';
import { apiRequest, formatINR } from '@/lib/api';
import { useDebounce } from '@/lib/useDebounce';
import { Project, Plot } from '@/types';
import BookingModal from '@/components/BookingModal';
import { SkeletonCard, Skeleton } from '@/components/ui/Skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);
  const [loadingPlots, setLoadingPlots] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [facingFilter, setFacingFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const debouncedSearch = useDebounce(search, 300);

  // Booking Modal
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [selectedPlotForBooking, setSelectedPlotForBooking] = useState<string | undefined>(undefined);

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const res = await apiRequest<Project[]>('/projects');
      setProjects(res);
      if (res.length > 0 && !selectedProjectId) {
        setSelectedProjectId(res[0].id);
      }
    } catch (err: unknown) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const loadPlots = async () => {
    if (!selectedProjectId) return;
    try {
      setLoadingPlots(true);
      let query = `/projects/${selectedProjectId}/plots?`;
      if (statusFilter !== 'ALL') query += `status=${statusFilter}&`;
      if (facingFilter !== 'ALL') query += `facing=${facingFilter}&`;
      if (debouncedSearch.trim()) query += `search=${encodeURIComponent(debouncedSearch.trim())}&`;

      const res = await apiRequest<Plot[]>(query);
      setPlots(res);
    } catch (err: unknown) {
      console.error('Failed to load plots:', err);
    } finally {
      setLoadingPlots(false);
    }
  };

  useEffect(() => {
    loadPlots();
  }, [selectedProjectId, statusFilter, facingFilter, debouncedSearch]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const handleBookPlot = (plotId: string) => {
    setSelectedPlotForBooking(plotId);
    setIsBookingOpen(true);
  };

  return (
    <ErrorBoundary componentName="ProjectInventory">
      <div className="space-y-4">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-emerald-700" />
              <span>Layout Projects & Plot Inventory</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time plot availability, dimensions, pricing, and instantaneous booking.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedPlotForBooking(undefined);
              setIsBookingOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Plot Booking</span>
          </button>
        </div>

        {/* Project Selector Tabs */}
        {loadingProjects ? (
          <div className="flex space-x-3 pb-1">
            <Skeleton className="h-24 w-56 rounded-lg" />
            <Skeleton className="h-24 w-56 rounded-lg" />
          </div>
        ) : (
          <div className="flex space-x-3 overflow-x-auto pb-1" role="tablist" aria-label="Layout projects">
            {projects.map((p) => {
              const isSelected = p.id === selectedProjectId;
              return (
                <button
                  key={p.id}
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={`p-3.5 rounded-lg text-left border transition-all cursor-pointer shrink-0 min-w-[220px] ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs truncate max-w-[140px]">{p.name}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        isSelected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <p className={`text-[11px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {p.location}
                  </p>
                  <div className="mt-2.5 flex items-center space-x-2 text-[11px] font-mono">
                    <span className={`font-semibold ${isSelected ? 'text-emerald-300' : 'text-emerald-700'}`}>
                      {p.counts?.available || 0} Open
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className={`font-semibold ${isSelected ? 'text-amber-300' : 'text-amber-700'}`}>
                      {p.counts?.booked || 0} Booked
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className={`font-semibold ${isSelected ? 'text-sky-300' : 'text-sky-700'}`}>
                      {p.counts?.sold || 0} Sold
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected Project Overview Card */}
        {selectedProject && (
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">{selectedProject.name}</h2>
                <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedProject.location}</span>
                </p>
              </div>
              {selectedProject.description && (
                <p className="text-xs text-slate-600 max-w-xl bg-slate-50 p-2 rounded border border-slate-200">
                  {selectedProject.description}
                </p>
              )}
            </div>

            {/* Filter Toolbar */}
            <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              {/* Status Filter Badges */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1" role="group" aria-label="Status filters">
                <span className="text-[11px] font-semibold text-slate-500 uppercase mr-1">Status:</span>
                {['ALL', 'AVAILABLE', 'BOOKED', 'SOLD'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded font-semibold text-xs transition-colors cursor-pointer ${
                      statusFilter === st
                        ? st === 'AVAILABLE'
                          ? 'bg-emerald-700 text-white shadow-2xs'
                          : st === 'BOOKED'
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : st === 'SOLD'
                              ? 'bg-slate-700 text-white shadow-2xs'
                              : 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'ALL' ? 'All Plots' : st}
                  </button>
                ))}
              </div>

              {/* Facing & Search */}
              <div className="flex items-center space-x-2">
                <select
                  value={facingFilter}
                  onChange={(e) => setFacingFilter(e.target.value)}
                  aria-label="Filter by plot facing direction"
                  className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white font-medium text-xs focus:ring-1 focus:ring-slate-900 focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">All Facings</option>
                  <option value="NORTH">North Facing</option>
                  <option value="EAST">East Facing</option>
                  <option value="SOUTH">South Facing</option>
                  <option value="WEST">West Facing</option>
                  <option value="NORTH_EAST">North-East Facing</option>
                </select>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Plot / Survey No..."
                    aria-label="Filter plots by plot or survey number"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-md border border-slate-300 font-medium text-xs focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Visual Plot Grid */}
        {loadingPlots ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, idx) => (
              <SkeletonCard key={idx} />
            ))}
          </div>
        ) : plots.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <div className="p-3 bg-slate-50 text-slate-400 rounded-full w-12 h-12 mx-auto flex items-center justify-center mb-2">
              <FileQuestion className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">No plots match your criteria</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting the status filter or clearing your search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {plots.map((pl) => {
              const isAvailable = pl.status === 'AVAILABLE';
              const isBooked = pl.status === 'BOOKED';

              return (
                <div
                  key={pl.id}
                  className={`rounded-lg border p-3.5 transition-all shadow-2xs flex flex-col justify-between ${
                    isAvailable
                      ? 'bg-white border-slate-200 hover:border-emerald-600'
                      : isBooked
                        ? 'bg-amber-50/30 border-amber-200'
                        : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-xs text-slate-900 tracking-tight">
                          Plot #{pl.plotNumber}
                        </span>
                        {pl.isCornerPlot && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 uppercase">
                            Corner
                          </span>
                        )}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isAvailable
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : isBooked
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {pl.status}
                      </span>
                    </div>

                    {/* Specs */}
                    <div className="space-y-1 text-xs text-slate-600 mb-3 font-mono">
                      <p className="flex items-center justify-between">
                        <span className="text-slate-400 font-sans font-medium text-[11px]">Dimensions:</span>
                        <span className="font-semibold text-slate-800 text-[11px]">{pl.dimension || '30 x 40'}</span>
                      </p>
                      <p className="flex items-center justify-between">
                        <span className="text-slate-400 font-sans font-medium text-[11px]">Area:</span>
                        <span className="font-semibold text-slate-800 text-[11px]">
                          {Number(pl.areaSqFt).toLocaleString('en-IN')} Sq.Ft.
                        </span>
                      </p>
                      <p className="flex items-center justify-between">
                        <span className="text-slate-400 font-sans font-medium text-[11px]">Facing:</span>
                        <span className="font-semibold text-slate-800 text-[11px]">{pl.facing}</span>
                      </p>
                      <p className="flex items-center justify-between">
                        <span className="text-slate-400 font-sans font-medium text-[11px]">Rate:</span>
                        <span className="font-semibold text-slate-700 text-[11px]">
                          ₹{Number(pl.ratePerSqFt).toLocaleString('en-IN')}/sqft
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Price</span>
                      <span className="font-mono font-bold text-xs text-slate-900 tracking-tight">
                        {formatINR(pl.totalPrice)}
                      </span>
                    </div>

                    {isAvailable ? (
                      <button
                        type="button"
                        onClick={() => handleBookPlot(pl.id)}
                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                      >
                        Book Plot
                      </button>
                    ) : (
                      <span className="text-xs font-medium text-slate-400 italic">
                        {isBooked ? 'Reserved' : 'Registered'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Booking Modal */}
        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          preselectedPlotId={selectedPlotForBooking}
          onSuccess={() => {
            loadProjects();
            loadPlots();
          }}
        />
      </div>
    </ErrorBoundary>
  );
}
