'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Compass,
  CheckCircle,
  Clock,
  Layers,
  Search,
  Filter,
  PlusCircle,
  Landmark,
} from 'lucide-react';
import { apiRequest, formatINR } from '@/lib/api';
import { Project, Plot } from '@/types';
import BookingModal from '@/components/BookingModal';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [facingFilter, setFacingFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  // Booking Modal
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [selectedPlotForBooking, setSelectedPlotForBooking] = useState<string | undefined>(undefined);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<Project[]>('/projects');
      setProjects(res);
      if (res.length > 0 && !selectedProjectId) {
        setSelectedProjectId(res[0].id);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const loadPlots = async () => {
    if (!selectedProjectId) return;
    try {
      let query = `/projects/${selectedProjectId}/plots?`;
      if (statusFilter !== 'ALL') query += `status=${statusFilter}&`;
      if (facingFilter !== 'ALL') query += `facing=${facingFilter}&`;
      if (search.trim()) query += `search=${encodeURIComponent(search.trim())}&`;

      const res = await apiRequest<Plot[]>(query);
      setPlots(res);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadPlots();
  }, [selectedProjectId, statusFilter, facingFilter, search]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const handleBookPlot = (plotId: string) => {
    setSelectedPlotForBooking(plotId);
    setIsBookingOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-emerald-600" />
            <span>Layout Projects & Plot Inventory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time plot availability, dimensions, pricing, and instantaneous booking.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedPlotForBooking(undefined);
            setIsBookingOpen(true);
          }}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-900/20 cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Plot Booking</span>
        </button>
      </div>

      {/* Project Selector Tabs */}
      <div className="flex space-x-3 overflow-x-auto pb-1">
        {projects.map((p) => {
          const isSelected = p.id === selectedProjectId;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedProjectId(p.id)}
              className={`px-5 py-3 rounded-2xl text-left border transition-all cursor-pointer shrink-0 min-w-[240px] ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/20'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm truncate">{p.name}</span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    isSelected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {p.status}
                </span>
              </div>
              <p className={`text-[11px] truncate ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                {p.location}
              </p>
              <div className="mt-3 flex items-center space-x-3 text-[10px]">
                <span className="text-emerald-400 font-semibold">
                  {p.counts?.available || 0} Open
                </span>
                <span className="text-amber-400 font-semibold">
                  {p.counts?.booked || 0} Booked
                </span>
                <span className="text-blue-400 font-semibold">
                  {p.counts?.sold || 0} Sold
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Project Overview Card */}
      {selectedProject && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">{selectedProject.name}</h2>
              <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>{selectedProject.location}</span>
              </p>
            </div>
            {selectedProject.description && (
              <p className="text-xs text-slate-600 max-w-xl bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                {selectedProject.description}
              </p>
            )}
          </div>

          {/* Filter Toolbar */}
          <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            {/* Status Filter Badges */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Status:</span>
              {['ALL', 'AVAILABLE', 'BOOKED', 'SOLD'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    statusFilter === st
                      ? st === 'AVAILABLE'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : st === 'BOOKED'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : st === 'SOLD'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'ALL' ? 'All Plots' : st}
                </button>
              ))}
            </div>

            {/* Facing & Search */}
            <div className="flex items-center space-x-2.5">
              <select
                value={facingFilter}
                onChange={(e) => setFacingFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="ALL">All Facings</option>
                <option value="NORTH">North Facing</option>
                <option value="EAST">East Facing</option>
                <option value="SOUTH">South Facing</option>
                <option value="WEST">West Facing</option>
                <option value="NORTH_EAST">North-East Facing</option>
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Plot / Survey No..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Plot Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {plots.map((pl) => {
          const isAvailable = pl.status === 'AVAILABLE';
          const isBooked = pl.status === 'BOOKED';
          const isSold = pl.status === 'SOLD';

          return (
            <div
              key={pl.id}
              className={`rounded-2xl border p-4.5 transition-all shadow-xs flex flex-col justify-between ${
                isAvailable
                  ? 'bg-white border-emerald-200/80 hover:shadow-md hover:border-emerald-400'
                  : isBooked
                  ? 'bg-amber-50/30 border-amber-200/80'
                  : 'bg-slate-100/60 border-slate-200'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-black text-base text-slate-900 tracking-tight">
                      Plot {pl.plotNumber}
                    </span>
                    {pl.isCornerPlot && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-700 uppercase">
                        Corner
                      </span>
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isAvailable
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : isBooked
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {pl.status}
                  </span>
                </div>

                {/* Specs */}
                <div className="space-y-1 text-xs text-slate-600 mb-3">
                  <p className="flex items-center justify-between">
                    <span className="text-slate-400">Dimensions:</span>
                    <span className="font-semibold text-slate-800">{pl.dimension || '30 x 40'}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-slate-400">Area:</span>
                    <span className="font-semibold text-slate-800">
                      {Number(pl.areaSqFt).toLocaleString('en-IN')} Sq.Ft.
                    </span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-slate-400">Facing:</span>
                    <span className="font-semibold text-slate-800">{pl.facing}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-slate-400">Rate:</span>
                    <span className="font-mono font-semibold text-slate-700">
                      ₹{Number(pl.ratePerSqFt).toLocaleString('en-IN')}/sqft
                    </span>
                  </p>
                </div>
              </div>

              {/* Price & Action */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Price</span>
                  <span className="font-black text-sm text-slate-900 font-mono">
                    {formatINR(pl.totalPrice)}
                  </span>
                </div>

                {isAvailable ? (
                  <button
                    onClick={() => handleBookPlot(pl.id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    Book Plot
                  </button>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400 italic">
                    {isBooked ? 'Under Plan' : 'Registered'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

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
  );
}
