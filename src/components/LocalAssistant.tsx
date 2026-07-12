import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Mic, MicOff, Send, RefreshCw, ChevronDown } from 'lucide-react';
import { Role, Vehicle, Driver, Trip, MaintenanceLog, ExpenseLog } from '../types';

// ─── Types ─────────────────────────────────────────────────────────────────

interface AppData {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenance: MaintenanceLog[];
  expenses: ExpenseLog[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  richData?: RichData;
  timestamp: Date;
}

type RichData =
  | { type: 'vehicles'; items: Vehicle[] }
  | { type: 'drivers'; items: Driver[] }
  | { type: 'trips'; items: Trip[] }
  | { type: 'maintenance'; items: MaintenanceLog[] }
  | { type: 'compare'; left: Record<string, string>; right: Record<string, string>; labels: [string, string] };

interface Intent {
  patterns: RegExp[];
  handler: (data: AppData, match: RegExpMatchArray) => { text: string; rich?: RichData; chips?: string[] };
}

interface BotConfig {
  name: string;
  color: string;
  greeting: string;
  starters: string[];
  quickChips: string[];
  intents: Intent[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2);

const today = new Date();

function isExpiring(dateStr: string, days = 30) {
  const d = new Date(dateStr);
  const diff = (d.getTime() - today.getTime()) / 86400000;
  return diff < days;
}

function isExpired(dateStr: string) {
  return new Date(dateStr) < today;
}

function statusColor(s: string) {
  if (s === 'Available') return 'text-emerald-400';
  if (s === 'On Trip') return 'text-blue-400';
  if (s === 'In Shop') return 'text-amber-400';
  if (s === 'Suspended') return 'text-red-400';
  return 'text-gray-400';
}

// ─── Bot Configs ────────────────────────────────────────────────────────────

const fleetConfig = (data: AppData): BotConfig => ({
  name: 'FleetBot',
  color: '#E67E22',
  greeting: "Hi! I'm **FleetBot**, your Fleet Manager assistant. I can help you monitor vehicles, track maintenance, and review costs. What would you like to know?",
  starters: [
    'How many vehicles do we have?',
    'Which vehicles are in the shop?',
    "Show driver license expiry",
    'What is our fleet utilization?',
  ],
  quickChips: ['Vehicles in shop', 'License expiring soon', "Today's cost", 'Fleet utilization'],
  intents: [
    {
      patterns: [/how many (vehicles|trucks|vans|fleet)/i, /vehicle count/i, /fleet size/i],
      handler: (d) => {
        const avail = d.vehicles.filter(v => v.status === 'Available').length;
        const onTrip = d.vehicles.filter(v => v.status === 'On Trip').length;
        const shop = d.vehicles.filter(v => v.status === 'In Shop').length;
        return {
          text: `We have **${d.vehicles.length}** vehicles total:\n• ${avail} Available\n• ${onTrip} On Trip\n• ${shop} In Shop`,
          rich: { type: 'vehicles', items: d.vehicles },
        };
      },
    },
    {
      patterns: [/in.?(shop|maintenance|repair)/i, /being.?serviced/i, /vehicles in shop/i],
      handler: (d) => {
        const items = d.vehicles.filter(v => v.status === 'In Shop');
        return items.length === 0
          ? { text: 'Good news — no vehicles are currently in the shop!' }
          : { text: `${items.length} vehicle(s) are currently in maintenance:`, rich: { type: 'vehicles', items } };
      },
    },
    {
      patterns: [/fleet utilization/i, /how.*used/i, /active.*fleet/i],
      handler: (d) => {
        const active = d.vehicles.filter(v => v.status === 'On Trip').length;
        const pct = d.vehicles.length ? Math.round((active / d.vehicles.length) * 100) : 0;
        return { text: `Fleet utilization is currently **${pct}%** — ${active} out of ${d.vehicles.length} vehicles are on active trips.` };
      },
    },
    {
      patterns: [/license.*expir/i, /expir.*license/i, /expiring.*soon/i, /driver.*expir/i],
      handler: (d) => {
        const items = d.drivers.filter(dr => isExpiring(dr.expiryDate));
        const expired = items.filter(dr => isExpired(dr.expiryDate));
        const soon = items.filter(dr => !isExpired(dr.expiryDate));
        return items.length === 0
          ? { text: 'All driver licenses are valid for more than 30 days. ✅' }
          : {
              text: `⚠️ **${expired.length}** expired, **${soon.length}** expiring within 30 days:`,
              rich: { type: 'drivers', items },
            };
      },
    },
    {
      patterns: [/(total|today'?s?).*(cost|expense|spend)/i, /operational cost/i, /how much.*spent/i],
      handler: (d) => {
        const fuel = d.expenses.filter(e => e.type === 'Fuel').reduce((s, e) => s + e.amount, 0);
        const other = d.expenses.filter(e => e.type !== 'Fuel').reduce((s, e) => s + e.amount, 0);
        const maint = d.maintenance.reduce((s, m) => s + (m.estCost || 0), 0);
        return { text: `**Total Operational Cost:**\n• Fuel: ₹${fuel.toLocaleString()}\n• Maintenance (est.): ₹${maint.toLocaleString()}\n• Other Expenses: ₹${other.toLocaleString()}\n• **Grand Total: ₹${(fuel + maint + other).toLocaleString()}**` };
      },
    },
    {
      patterns: [/show.*([A-Z]{2,}[-][A-Z0-9]+)/i, /tell me about.*([A-Z]{2,}[-][A-Z0-9]+)/i],
      handler: (d, match) => {
        const regNo = match[1]?.toUpperCase();
        const v = d.vehicles.find(x => x.regNo.toUpperCase() === regNo);
        if (!v) return { text: `I couldn't find a vehicle with registration **${regNo}**. Try "VAN-01" or "TRUCK-5".` };
        return {
          text: `Here's the record for **${v.regNo}**:`,
          rich: { type: 'vehicles', items: [v] },
        };
      },
    },
    {
      patterns: [/retire.+([A-Z]{2,}[-][A-Z0-9]+)/i],
      handler: (_d, match) => {
        const regNo = match[1]?.toUpperCase();
        return { text: `To retire **${regNo}**, please go to the Fleet page and use the status dropdown to set it to "Retired", or use the retire button in the Actions column. This action is currently protected and requires confirmation in the UI.`, chips: ['Fleet utilization', 'Vehicles in shop'] };
      },
    },
    {
      patterns: [/add vehicle/i, /new vehicle/i, /create vehicle/i],
      handler: () => ({ text: 'To add a new vehicle, navigate to **Fleet** in the sidebar and click the **"Add Vehicle"** button at the top right. I\'ll help you verify the details once it\'s registered!', chips: ['Vehicles in shop', 'Fleet utilization'] }),
    },
    {
      patterns: [/retired/i, /decommissioned/i],
      handler: (d) => {
        const items = d.vehicles.filter(v => v.status === 'Retired');
        return items.length === 0
          ? { text: 'No vehicles are currently retired.' }
          : { text: `${items.length} retired vehicle(s):`, rich: { type: 'vehicles', items } };
      },
    },
  ],
});

const dispatchConfig = (data: AppData): BotConfig => ({
  name: 'DispatchBot',
  color: '#3498DB',
  greeting: "Hi! I'm **DispatchBot**, your Dispatch assistant. I can help you check vehicle/driver availability, monitor trips, and coordinate dispatches. What do you need?",
  starters: [
    'Which vehicles are available right now?',
    'Which drivers are free?',
    'Show me active trips',
    'Status of TRIP0001',
  ],
  quickChips: ['Available vehicles', 'Available drivers', 'Active trips', 'Create trip'],
  intents: [
    {
      patterns: [/available vehicles/i, /free vehicles/i, /vehicles.*available/i, /which vehicles.*free/i],
      handler: (d) => {
        const items = d.vehicles.filter(v => v.status === 'Available');
        return items.length === 0
          ? { text: 'No vehicles are currently available. All are either on trip or in maintenance.' }
          : { text: `**${items.length}** vehicle(s) are available:`, rich: { type: 'vehicles', items } };
      },
    },
    {
      patterns: [/available drivers/i, /free drivers/i, /drivers.*available/i],
      handler: (d) => {
        const items = d.drivers.filter(dr => dr.status === 'Available' && !isExpired(dr.expiryDate));
        return items.length === 0
          ? { text: 'No drivers are currently available with a valid license.' }
          : { text: `**${items.length}** eligible driver(s) available:`, rich: { type: 'drivers', items } };
      },
    },
    {
      patterns: [/active trips/i, /trips.*dispatched/i, /ongoing trips/i],
      handler: (d) => {
        const items = d.trips.filter(t => t.status === 'Dispatched');
        return items.length === 0
          ? { text: 'No trips are currently active.' }
          : { text: `**${items.length}** active trip(s):`, rich: { type: 'trips', items } };
      },
    },
    {
      patterns: [/status of (TRIP\w+)/i, /(TRIP\w+).*(status|update)/i, /where is (TRIP\w+)/i],
      handler: (d, match) => {
        const code = match[1]?.toUpperCase();
        const trip = d.trips.find(t => t.code.toUpperCase() === code);
        if (!trip) return { text: `Trip **${code}** not found. Please check the trip code.` };
        return { text: `**${trip.code}** is currently **${trip.status}**.\nRoute: ${trip.route.source} → ${trip.route.destination}\nCargo: ${trip.cargoWeight} kg`, rich: { type: 'trips', items: [trip] } };
      },
    },
    {
      patterns: [/can ([A-Z]{2,}[-][A-Z0-9]+) carry (\d+)\s*kg/i, /capacity of ([A-Z]{2,}[-][A-Z0-9]+)/i],
      handler: (d, match) => {
        const regNo = match[1]?.toUpperCase();
        const weight = match[2] ? Number(match[2]) : null;
        const v = d.vehicles.find(x => x.regNo.toUpperCase() === regNo);
        if (!v) return { text: `Vehicle **${regNo}** not found.` };
        if (weight === null) return { text: `**${v.regNo}** has a max capacity of **${v.capacity.toLocaleString()} kg**.` };
        const ok = weight <= v.capacity;
        return { text: ok ? `✅ Yes, **${v.regNo}** can carry ${weight} kg — its max is **${v.capacity} kg** with ${v.capacity - weight} kg to spare.` : `❌ No, **${v.regNo}** cannot carry ${weight} kg — its max capacity is **${v.capacity} kg** (${weight - v.capacity} kg over limit).` };
      },
    },
    {
      patterns: [/dispatch (TRIP\w+)/i, /send out (TRIP\w+)/i],
      handler: (d, match) => {
        const code = match[1]?.toUpperCase();
        const trip = d.trips.find(t => t.code.toUpperCase() === code);
        if (!trip) return { text: `Trip **${code}** not found.` };
        if (trip.status !== 'Pending') return { text: `**${trip.code}** is already **${trip.status}** — only Pending trips can be dispatched.` };
        return { text: `To dispatch **${trip.code}** (${trip.route.source} → ${trip.route.destination}), go to the **Trips** page, find the card, and click the **Dispatch** button. This will mark the vehicle and driver as "On Trip".`, chips: ['Active trips', 'Available vehicles'] };
      },
    },
    {
      patterns: [/new trip.*to (\w+)/i, /create trip.*to (\w+)/i, /trip to (\w+)/i],
      handler: (_d, match) => {
        const dest = match[1];
        return { text: `To create a trip to **${dest}**, go to the **Trips** page — the Create Trip panel is on the right. Enter **${dest}** as the destination, pick an available vehicle and driver, and hit Dispatch!`, chips: ['Available vehicles', 'Available drivers'] };
      },
    },
    {
      patterns: [/pending trips/i, /trips.*waiting/i, /draft trips/i],
      handler: (d) => {
        const items = d.trips.filter(t => t.status === 'Pending');
        return items.length === 0
          ? { text: 'No trips are pending dispatch right now.' }
          : { text: `**${items.length}** trip(s) awaiting dispatch:`, rich: { type: 'trips', items } };
      },
    },
  ],
});

const safetyConfig = (data: AppData): BotConfig => ({
  name: 'SafetyBot',
  color: '#27AE60',
  greeting: "Hi! I'm **SafetyBot**, your Safety Officer assistant. I help you monitor driver eligibility, license compliance, and safety scores. What would you like to check?",
  starters: [
    'Show me expired licenses',
    'Who has a low safety score?',
    'List suspended drivers',
    'Tell me about driver Ravan',
  ],
  quickChips: ['Expiring licenses', 'Suspended drivers', 'Low safety scores', 'Driver lookup'],
  intents: [
    {
      patterns: [/expir(ing|ed) licen(ses|ce)/i, /licen(ses|ce).*expir/i, /expiring soon/i],
      handler: (d) => {
        const expired = d.drivers.filter(dr => isExpired(dr.expiryDate));
        const soon = d.drivers.filter(dr => !isExpired(dr.expiryDate) && isExpiring(dr.expiryDate));
        const all = [...expired, ...soon];
        return all.length === 0
          ? { text: '✅ All driver licenses are valid for more than 30 days!' }
          : { text: `⚠️ **${expired.length}** expired, **${soon.length}** expiring within 30 days:`, rich: { type: 'drivers', items: all } };
      },
    },
    {
      patterns: [/suspended drivers/i, /drivers.*suspended/i, /who.*suspended/i],
      handler: (d) => {
        const items = d.drivers.filter(dr => dr.status === 'Suspended');
        return items.length === 0
          ? { text: 'No drivers are currently suspended. ✅' }
          : { text: `**${items.length}** driver(s) are suspended:`, rich: { type: 'drivers', items } };
      },
    },
    {
      patterns: [/low safety score/i, /safety score.*below/i, /poor.*(safety|score)/i, /unsafe drivers/i],
      handler: (d) => {
        const threshold = 80;
        const items = d.drivers.filter(dr => dr.safetyScore < threshold);
        return items.length === 0
          ? { text: `✅ All drivers have a safety score of ${threshold} or above.` }
          : { text: `⚠️ **${items.length}** driver(s) have a safety score below **${threshold}**:`, rich: { type: 'drivers', items } };
      },
    },
    {
      patterns: [/tell me about.+?(\w+)/i, /driver.*(\w+)/i, /lookup.*(\w+)/i, /find driver.+?(\w+)/i],
      handler: (d, match) => {
        const name = match[1]?.toLowerCase();
        const dr = d.drivers.find(x => x.name.toLowerCase().includes(name));
        if (!dr) return { text: `No driver found matching "**${match[1]}**". Try their first name.` };
        const exp = isExpired(dr.expiryDate) ? '❌ Expired' : isExpiring(dr.expiryDate) ? '⚠️ Expiring soon' : '✅ Valid';
        return {
          text: `**${dr.name}** (${dr.licenseId})\nCategory: ${dr.category}\nSafety Score: ${dr.safetyScore}/100\nLicense: ${exp} (${dr.expiryDate})\nStatus: ${dr.status}`,
          rich: { type: 'drivers', items: [dr] },
        };
      },
    },
    {
      patterns: [/off.?duty/i, /drivers.*off/i],
      handler: (d) => {
        const items = d.drivers.filter(dr => dr.status === 'Off Duty');
        return items.length === 0
          ? { text: 'No drivers are currently off duty.' }
          : { text: `**${items.length}** driver(s) off duty:`, rich: { type: 'drivers', items } };
      },
    },
    {
      patterns: [/suspend.+?(\w+)/i],
      handler: (d, match) => {
        const name = match[1]?.toLowerCase();
        const dr = d.drivers.find(x => x.name.toLowerCase().includes(name));
        if (!dr) return { text: `No driver found matching "**${match[1]}**".` };
        if (dr.status === 'Suspended') return { text: `**${dr.name}** is already suspended.` };
        return { text: `To suspend **${dr.name}**, go to the **Drivers** page, find their row, and change their status to "Suspended" using the status dropdown in the Actions column.`, chips: ['Suspended drivers', 'Driver lookup'] };
      },
    },
    {
      patterns: [/all drivers/i, /list.*drivers/i, /how many drivers/i],
      handler: (d) => {
        const avail = d.drivers.filter(dr => dr.status === 'Available').length;
        const onTrip = d.drivers.filter(dr => dr.status === 'On Trip').length;
        return {
          text: `We have **${d.drivers.length}** total drivers:\n• ${avail} Available\n• ${onTrip} On Trip\n• ${d.drivers.filter(dr => dr.status === 'Off Duty').length} Off Duty\n• ${d.drivers.filter(dr => dr.status === 'Suspended').length} Suspended`,
          rich: { type: 'drivers', items: d.drivers },
        };
      },
    },
  ],
});

const financeConfig = (data: AppData): BotConfig => ({
  name: 'FinanceBot',
  color: '#9B59B6',
  greeting: "Hi! I'm **FinanceBot**, your Financial Analyst assistant. I can help you analyze costs, fuel efficiency, and generate financial insights. What would you like to review?",
  starters: [
    'What is our total operational cost?',
    'Which vehicle costs the most?',
    'What is our fuel spend?',
    'Compare VAN-01 vs TRUCK-5',
  ],
  quickChips: ['Total cost this month', 'Fuel spend', 'Top cost vehicle', 'ROI report'],
  intents: [
    {
      patterns: [/total.*(cost|expense|spend)/i, /operational cost/i, /how much.*spent/i, /overall.*(cost|spend)/i],
      handler: (d) => {
        const fuel = d.expenses.filter(e => e.type === 'Fuel').reduce((s, e) => s + e.amount, 0);
        const maint = d.maintenance.reduce((s, m) => s + (m.estCost || 0), 0);
        const other = d.expenses.filter(e => e.type !== 'Fuel').reduce((s, e) => s + e.amount, 0);
        return { text: `**Total Operational Cost Breakdown:**\n• 🔥 Fuel: ₹${fuel.toLocaleString()}\n• 🔧 Maintenance (est.): ₹${maint.toLocaleString()}\n• 📋 Other Expenses: ₹${other.toLocaleString()}\n\n**Grand Total: ₹${(fuel + maint + other).toLocaleString()}**` };
      },
    },
    {
      patterns: [/fuel.*(spend|cost|total)/i, /how much.*fuel/i, /fuel expense/i],
      handler: (d) => {
        const logs = d.expenses.filter(e => e.type === 'Fuel');
        const total = logs.reduce((s, e) => s + e.amount, 0);
        return { text: `**Fuel Expenditure:**\n• Total logged: ₹${total.toLocaleString()}\n• Fuel entries: ${logs.length}`, rich: { type: 'maintenance', items: [] } };
      },
    },
    {
      patterns: [/top cost vehicle/i, /most expensive vehicle/i, /highest cost/i, /which vehicle.*most/i],
      handler: (d) => {
        const costMap = new Map<string, number>();
        d.vehicles.forEach(v => costMap.set(v.id, 0));
        d.expenses.filter(e => e.vehicleId).forEach(e => {
          const vid = e.vehicleId as string;
          costMap.set(vid, (costMap.get(vid) || 0) + e.amount);
        });
        const sorted = d.vehicles
          .map(v => ({ vehicle: v, cost: costMap.get(v.id) || 0 }))
          .sort((a, b) => b.cost - a.cost);
        const top = sorted[0];
        return {
          text: top
            ? `The most expensive vehicle to operate is **${top.vehicle.regNo}** with ₹${top.cost.toLocaleString()} in recorded expenses.`
            : 'No expense data available yet.',
          chips: ['Total cost this month', 'Fuel spend'],
        };
      },
    },
    {
      patterns: [/compare ([A-Z0-9-]+) (?:vs|versus|and) ([A-Z0-9-]+)/i],
      handler: (d, match) => {
        const r1 = match[1]?.toUpperCase();
        const r2 = match[2]?.toUpperCase();
        const v1 = d.vehicles.find(v => v.regNo.toUpperCase() === r1);
        const v2 = d.vehicles.find(v => v.regNo.toUpperCase() === r2);
        if (!v1 || !v2) return { text: `Couldn't find both vehicles. Make sure to use exact reg numbers like "VAN-01 vs TRUCK-5".` };
        const cost = (v: Vehicle) => {
          const e = d.expenses.filter(x => x.vehicleId === v.id).reduce((s, x) => s + x.amount, 0);
          const m = d.maintenance.filter(x => x.vehicleId === v.id).reduce((s, x) => s + (x.estCost || 0), 0);
          return e + m;
        };
        const trips = (v: Vehicle) => d.trips.filter(t => t.vehicleId === v.id && t.status === 'Completed').length;
        return {
          text: `Side-by-side comparison:`,
          rich: {
            type: 'compare',
            labels: [v1.regNo, v2.regNo],
            left: {
              Type: v1.type,
              Capacity: `${v1.capacity} kg`,
              Odometer: `${v1.odometer.toLocaleString()} km`,
              'Total Cost': `₹${cost(v1).toLocaleString()}`,
              'Completed Trips': String(trips(v1)),
              Status: v1.status,
            },
            right: {
              Type: v2.type,
              Capacity: `${v2.capacity} kg`,
              Odometer: `${v2.odometer.toLocaleString()} km`,
              'Total Cost': `₹${cost(v2).toLocaleString()}`,
              'Completed Trips': String(trips(v2)),
              Status: v2.status,
            },
          },
        };
      },
    },
    {
      patterns: [/fuel efficiency/i, /km.?per.?liter/i, /fuel economy/i],
      handler: (d) => {
        const completedWithFuel = d.trips.filter(t => t.status === 'Completed' && t.fuelConsumed && t.actualDistance);
        if (completedWithFuel.length === 0) return { text: 'No completed trips with fuel data are available yet to calculate efficiency.' };
        const totalDist = completedWithFuel.reduce((s, t) => s + (t.actualDistance || 0), 0);
        const totalFuel = completedWithFuel.reduce((s, t) => s + (t.fuelConsumed || 0), 0);
        const avg = totalFuel ? (totalDist / totalFuel).toFixed(2) : '0';
        return { text: `**Fleet Fuel Efficiency:**\n• Total distance: ${totalDist.toLocaleString()} km\n• Total fuel: ${totalFuel.toLocaleString()} L\n• Fleet average: **${avg} km/L**\n(Based on ${completedWithFuel.length} completed trips)` };
      },
    },
    {
      patterns: [/export.*report/i, /download.*csv/i, /get.*report/i],
      handler: () => ({
        text: 'To export the vehicle cost report as CSV, go to **Analytics** in the sidebar, switch to the **KPIs Overview** tab, and look for the **Export CSV** button at the top right. The report includes fuel, maintenance, and operational cost per vehicle.',
        chips: ['Total cost this month', 'Fuel spend'],
      }),
    },
    {
      patterns: [/ROI/i, /return on investment/i],
      handler: (d) => {
        const info = d.vehicles.map(v => {
          const cost = d.expenses.filter(e => e.vehicleId === v.id).reduce((s, e) => s + e.amount, 0)
            + d.maintenance.filter(m => m.vehicleId === v.id).reduce((s, m) => s + (m.estCost || 0), 0);
          return `• **${v.regNo}**: acq ₹${v.acqCost.toLocaleString()} | ops cost ₹${cost.toLocaleString()}`;
        });
        return { text: `**Vehicle ROI Overview** (acquisition vs operational cost):\n${info.join('\n')}\n\nSee the Analytics page for a full ROI breakdown with revenue input.` };
      },
    },
  ],
});

// ─── Config loader ──────────────────────────────────────────────────────────

function getConfig(role: Role, data: AppData): BotConfig {
  switch (role) {
    case 'fleet_manager': return fleetConfig(data);
    case 'dispatcher': return dispatchConfig(data);
    case 'safety_officer': return safetyConfig(data);
    case 'financial_analyst': return financeConfig(data);
    default: return fleetConfig(data);
  }
}

// ─── Intent Matcher ─────────────────────────────────────────────────────────

function matchIntent(
  message: string,
  intents: Intent[],
  data: AppData
): { text: string; rich?: RichData; chips?: string[] } | null {
  for (const intent of intents) {
    for (const pattern of intent.patterns) {
      const m = message.match(pattern);
      if (m) return intent.handler(data, m);
    }
  }
  return null;
}

// ─── Rich Renderers ─────────────────────────────────────────────────────────

function RichCard({ rich }: { rich: RichData }) {
  if (rich.type === 'vehicles') {
    if (rich.items.length === 0) return null;
    return (
      <div className="mt-2 rounded-lg overflow-hidden border border-white/10 text-xs">
        <table className="w-full">
          <thead>
            <tr className="bg-white/5 text-gray-400">
              <th className="px-2 py-1.5 text-left font-medium">Reg No</th>
              <th className="px-2 py-1.5 text-left font-medium">Type</th>
              <th className="px-2 py-1.5 text-left font-medium">Status</th>
              <th className="px-2 py-1.5 text-right font-medium">Cap (kg)</th>
            </tr>
          </thead>
          <tbody>
            {rich.items.slice(0, 6).map(v => (
              <tr key={v.id} className="border-t border-white/5">
                <td className="px-2 py-1.5 font-medium">{v.regNo}</td>
                <td className="px-2 py-1.5 text-gray-400">{v.type}</td>
                <td className={`px-2 py-1.5 ${statusColor(v.status)}`}>{v.status}</td>
                <td className="px-2 py-1.5 text-right">{v.capacity.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rich.items.length > 6 && <div className="px-2 py-1 text-gray-500 text-[10px]">+ {rich.items.length - 6} more…</div>}
      </div>
    );
  }

  if (rich.type === 'drivers') {
    if (rich.items.length === 0) return null;
    return (
      <div className="mt-2 rounded-lg overflow-hidden border border-white/10 text-xs">
        <table className="w-full">
          <thead>
            <tr className="bg-white/5 text-gray-400">
              <th className="px-2 py-1.5 text-left font-medium">Name</th>
              <th className="px-2 py-1.5 text-left font-medium">Score</th>
              <th className="px-2 py-1.5 text-left font-medium">Expiry</th>
              <th className="px-2 py-1.5 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rich.items.slice(0, 6).map(d => (
              <tr key={d.id} className="border-t border-white/5">
                <td className="px-2 py-1.5 font-medium">{d.name}</td>
                <td className={`px-2 py-1.5 ${d.safetyScore >= 90 ? 'text-emerald-400' : d.safetyScore >= 75 ? 'text-amber-400' : 'text-red-400'}`}>
                  {d.safetyScore}/100
                </td>
                <td className={`px-2 py-1.5 ${isExpired(d.expiryDate) ? 'text-red-400' : isExpiring(d.expiryDate) ? 'text-amber-400' : 'text-gray-400'}`}>
                  {d.expiryDate}
                </td>
                <td className={`px-2 py-1.5 ${statusColor(d.status)}`}>{d.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rich.items.length > 6 && <div className="px-2 py-1 text-gray-500 text-[10px]">+ {rich.items.length - 6} more…</div>}
      </div>
    );
  }

  if (rich.type === 'trips') {
    if (rich.items.length === 0) return null;
    return (
      <div className="mt-2 rounded-lg overflow-hidden border border-white/10 text-xs">
        <table className="w-full">
          <thead>
            <tr className="bg-white/5 text-gray-400">
              <th className="px-2 py-1.5 text-left font-medium">Code</th>
              <th className="px-2 py-1.5 text-left font-medium">Route</th>
              <th className="px-2 py-1.5 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rich.items.slice(0, 6).map(t => (
              <tr key={t.id} className="border-t border-white/5">
                <td className="px-2 py-1.5 font-mono font-medium">{t.code}</td>
                <td className="px-2 py-1.5 text-gray-400">{t.route.source} → {t.route.destination}</td>
                <td className={`px-2 py-1.5 ${statusColor(t.status)}`}>{t.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rich.items.length > 6 && <div className="px-2 py-1 text-gray-500 text-[10px]">+ {rich.items.length - 6} more…</div>}
      </div>
    );
  }

  if (rich.type === 'compare') {
    const keys = Object.keys(rich.left);
    return (
      <div className="mt-2 rounded-lg overflow-hidden border border-white/10 text-xs">
        <table className="w-full">
          <thead>
            <tr className="bg-white/5 text-gray-400">
              <th className="px-2 py-1.5 text-left font-medium">Metric</th>
              <th className="px-2 py-1.5 text-center text-orange-400 font-medium">{rich.labels[0]}</th>
              <th className="px-2 py-1.5 text-center text-blue-400 font-medium">{rich.labels[1]}</th>
            </tr>
          </thead>
          <tbody>
            {keys.map(k => (
              <tr key={k} className="border-t border-white/5">
                <td className="px-2 py-1.5 text-gray-400">{k}</td>
                <td className="px-2 py-1.5 text-center">{rich.left[k]}</td>
                <td className="px-2 py-1.5 text-center">{rich.right[k]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
}

// ─── Format markdown-ish text ────────────────────────────────────────────────

function FormatText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        const formatted = line
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        return (
          <div
            key={i}
            className="leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatted || '&nbsp;' }}
          />
        );
      })}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface LocalAssistantProps {
  role: Role;
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenance: MaintenanceLog[];
  expenses: ExpenseLog[];
}

export function LocalAssistant({ role, vehicles, drivers, trips, maintenance, expenses }: LocalAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentChips, setCurrentChips] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [hasSpeechAPI, setHasSpeechAPI] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const data: AppData = { vehicles, drivers, trips, maintenance, expenses };
  const config = getConfig(role, data);

  // Check Speech API support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setHasSpeechAPI(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-IN';
      recognitionRef.current.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = () => setIsListening(false);
    }
  }, []);

  // Greeting on open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: uid(),
        role: 'bot',
        content: config.greeting,
        timestamp: new Date(),
      }]);
      setCurrentChips(config.quickChips);
    }
  }, [isOpen]);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      // keep messages for session
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = { id: uid(), role: 'user', content: trimmed, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const result = matchIntent(trimmed, config.intents, data);
      const botContent = result?.text || `I'm not sure how to answer that, but here are some things I can help with as your ${config.name}:`;
      const botMsg: ChatMessage = {
        id: uid(),
        role: 'bot',
        content: botContent,
        richData: result?.rich,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
      setCurrentChips(result?.chips || config.quickChips);
    }, 450 + Math.random() * 200);
  }, [config, data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: uid(),
      role: 'bot',
      content: config.greeting,
      timestamp: new Date(),
    }]);
    setCurrentChips(config.quickChips);
  };

  const botInitial = config.name[0];

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #E67E22, #D35400)' }}
        title={`Open ${config.name}`}
      >
        {isOpen
          ? <ChevronDown className="w-6 h-6 text-white" />
          : <MessageCircle className="w-6 h-6 text-white" />
        }
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-bg-primary animate-pulse" />
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[380px] max-h-[580px] flex flex-col rounded-2xl shadow-2xl border border-white/10 overflow-hidden transition-all duration-300 ${
          isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        style={{ background: '#1a1a1a' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #1f1f1f, #252525)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: config.color }}
            >
              {botInitial}
            </div>
            <div>
              <div className="font-semibold text-white text-sm">{config.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                <span className="text-[10px] text-emerald-400 font-medium">Local · Offline</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={clearChat}
              className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
              title="New chat"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 0 }}>
          {messages.length === 0 && (
            <div className="text-center py-8 space-y-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto"
                style={{ background: config.color + '33', border: `2px solid ${config.color}` }}
              >
                {botInitial}
              </div>
              <p className="text-gray-500 text-sm">Ask me anything about {role.replace('_', ' ')} data</p>
              <div className="space-y-2">
                {config.starters.map(s => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="block w-full text-left text-xs px-3 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
              {msg.role === 'bot' && (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{ background: config.color }}
                >
                  {botInitial}
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'rounded-tr-sm text-white'
                    : 'rounded-tl-sm text-gray-100'
                }`}
                style={
                  msg.role === 'user'
                    ? { background: 'linear-gradient(135deg, #E67E22, #D35400)' }
                    : { background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.07)' }
                }
              >
                <FormatText text={msg.content} />
                {msg.richData && <RichCard rich={msg.richData} />}
                <div className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-white/60 text-right' : 'text-gray-600'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: config.color }}
              >
                {botInitial}
              </div>
              <div
                className="rounded-2xl rounded-tl-sm px-4 py-3"
                style={{ background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="flex gap-1 items-center h-4">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Chips */}
        {currentChips.length > 0 && messages.length > 0 && (
          <div className="px-4 py-2 flex gap-2 flex-wrap flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {currentChips.slice(0, 4).map(chip => (
              <button
                key={chip}
                onClick={() => sendMessage(chip)}
                className="text-[11px] px-2.5 py-1 rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-orange-500/50 hover:bg-orange-500/10 transition-colors whitespace-nowrap"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: '#1f1f1f' }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Ask ${config.name}…`}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-orange-500/50 transition-colors"
          />
          {hasSpeechAPI && (
            <button
              type="button"
              onClick={toggleVoice}
              className={`p-2 rounded-xl transition-colors ${isListening ? 'bg-red-500/20 text-red-400' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}
              title={isListening ? 'Stop listening' : 'Voice input'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2 rounded-xl disabled:opacity-30 transition-all hover:scale-105 active:scale-95"
            style={{ background: input.trim() ? 'linear-gradient(135deg, #E67E22, #D35400)' : undefined }}
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
      </div>
    </>
  );
}
