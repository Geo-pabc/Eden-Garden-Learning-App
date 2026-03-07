import React, { useEffect, useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { CLASSES, SUBJECTS, Notice } from '../types';
import { Bell, BookOpen, ClipboardList, Users, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    fetch('/api/notices')
      .then(res => res.json())
      .then(setNotices);
  }, []);

  const stats = [
    { label: 'Classes', value: CLASSES.length, icon: BookOpen, color: 'bg-blue-500' },
    { label: 'Subjects', value: SUBJECTS.length, icon: ClipboardList, color: 'bg-emerald-500' },
    { label: 'Active Notices', value: notices.length, icon: Bell, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name}!</h1>
          <p className="text-slate-500">Here's what's happening in Eden Garden today.</p>
        </div>
        <div className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold">
          Role: {user?.role.toUpperCase()} {user?.class_name && `• ${user.class_name}`}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4"
          >
            <div className={`${stat.color} p-3 rounded-xl text-white`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Notices Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              Latest Notices
            </h3>
            <Link to="/notices" className="text-sm text-primary font-semibold hover:underline">View All</Link>
          </div>
          <div className="space-y-4">
            {notices.slice(0, 3).map((notice) => (
              <div key={notice.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-slate-700 text-sm">{notice.content}</p>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">
                  {new Date(notice.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
            {notices.length === 0 && (
              <p className="text-center text-slate-400 py-8 text-sm">No notices at the moment.</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Quick Access</h3>
          <div className="grid grid-cols-1 gap-4">
            {user?.role === 'admin' && (
              <Link to="/admin/users" className="group flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-primary/5 transition-colors">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-slate-700">Manage Users</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
              </Link>
            )}
            <Link to="/materials" className="group flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-primary/5 transition-colors">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-primary" />
                <span className="font-semibold text-slate-700">Study Materials</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
            </Link>
            <Link to="/homework" className="group flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-primary/5 transition-colors">
              <div className="flex items-center gap-3">
                <ClipboardList className="w-5 h-5 text-primary" />
                <span className="font-semibold text-slate-700">Homework</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
