import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/supabase/supabaseClient';
import { useUser } from '@/UserContext';

const FacultySchedule = () => {
  const { userData } = useUser();
  const [timetableUrl, setTimetableUrl] = useState<string | null>(null);
  const [facultyName, setFacultyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const timeSlots = ['09:10-10:10','10:10-11:10','11:10-12:10','12:10-01:10','02:20-03:20','03:20-04:20'];
  type SlotEntry = { course: string; room: string; class_name: string; is_lab?: boolean; batch_number?: number; lab_id?: string };
  const [grid, setGrid] = useState<Record<number, SlotEntry[]>>({});

  useEffect(() => {
    const fetchTimetable = async () => {
      console.log('FacultySchedule: Starting fetch, userData:', userData);
      
      if (!userData?.user_id) {
        console.log('FacultySchedule: No user_id found');
        setError('Unable to identify faculty account.');
        setLoading(false);
        return;
      }

      console.log('FacultySchedule: Fetching for faculty user_id:', userData.user_id);

      try {
        // Fetch faculty details
        const { data: facultyData, error: facultyError } = await supabase
          .from('faculty')
          .select('timetable_url, fname, lname')
          .eq('user_id', userData.user_id)
          .maybeSingle();

        console.log('FacultySchedule: faculty fetch result:', { data: facultyData, error: facultyError });

        if (facultyError) throw facultyError;

        setTimetableUrl(facultyData?.timetable_url || null);
        setFacultyName(facultyData ? `${facultyData.fname} ${facultyData.lname}` : '');

        // Fetch structured timetable
        let { data: slots, error: slotsError } = await supabase
          .from('faculty_timetables')
          .select('day_index, slot_index, course, room, class_name, is_lab, batch_number, lab_id')
          .eq('faculty_id', userData.user_id)
          .order('day_index, slot_index, batch_number');
        
        console.log('FacultySchedule: Initial timetable fetch:', { slots, error: slotsError });
        
        // If lab columns don't exist, fall back to basic columns
        if (slotsError && slotsError.message?.includes('column')) {
          console.warn('Lab columns not found in FacultySchedule, using basic structure');
          const fallback = await supabase
            .from('faculty_timetables')
            .select('day_index, slot_index, course, room, class_name')
            .eq('faculty_id', userData.user_id)
            .order('day_index, slot_index');
          console.log('FacultySchedule: Fallback fetch result:', fallback);
          slots = fallback.data?.map(row => ({
            ...row,
            is_lab: false,
            batch_number: null,
            lab_id: null
          })) || null;
          slotsError = fallback.error;
        }
        
        if (slotsError) {
          console.error('Fetch slots error:', slotsError);
          throw slotsError;
        }
        
        console.log('FacultySchedule: Final slots data:', slots);
        console.log('FacultySchedule: Number of slots:', slots?.length || 0);
        
        const init: Record<number, SlotEntry[]> = {};
        for (let d = 0; d < days.length; d++) init[d] = Array.from({ length: timeSlots.length }, () => ({ course: '', room: '', class_name: '' }));
        
        // Group lab entries
        const labGroups: Record<string, any[]> = {};
        (slots || []).forEach(row => {
          if (row.is_lab && row.lab_id) {
            if (!labGroups[row.lab_id]) labGroups[row.lab_id] = [];
            labGroups[row.lab_id].push(row);
          } else if (init[row.day_index] && init[row.day_index][row.slot_index] !== undefined) {
            init[row.day_index][row.slot_index] = {
              course: row.course || '',
              room: row.room || '',
              class_name: row.class_name || ''
            };
          }
        });
        
        // Store lab batches at starting slot
        Object.values(labGroups).forEach(batches => {
          if (batches.length > 0) {
            const first = batches[0];
            if (init[first.day_index] && init[first.day_index][first.slot_index]) {
              init[first.day_index][first.slot_index] = batches.map(b => ({
                course: b.course || '',
                room: b.room || '',
                class_name: b.class_name || '',
                is_lab: true,
                batch_number: b.batch_number,
                lab_id: b.lab_id
              })) as any;
            }
          }
        });
        
        setGrid(init);
      } catch (err) {
        console.error('Error fetching timetable:', err);
        setError('Unable to load timetable right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, [userData]);

  // Check if grid has any actual data
  const hasGridData = useMemo(() => {
    return Object.values(grid).some(daySlots => 
      daySlots.some(slot => {
        if (Array.isArray(slot)) {
          return slot.some(batch => batch.course || batch.room || batch.class_name);
        }
        return slot.course || slot.room || slot.class_name;
      })
    );
  }, [grid]);

  const isPdf = useMemo(() => {
    if (!timetableUrl) return false;
    return timetableUrl.toLowerCase().includes('.pdf');
  }, [timetableUrl]);

  const renderTimetable = () => {
    if (!timetableUrl) return null;
    if (isPdf) {
      return (
        <iframe
          src={`${timetableUrl}#toolbar=0`}
          title="Faculty timetable"
          className="w-full h-[780px] rounded-lg border"
        />
      );
    }

    return (
      <img
        src={timetableUrl}
        alt="Faculty timetable"
        className="w-full rounded-lg border shadow-sm"
      />
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Teaching Schedule</h1>
          <p className="text-gray-600">Your weekly timetable as uploaded by the administrator.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Faculty Timetable</CardTitle>
            <CardDescription>
              {facultyName ? `Faculty: ${facultyName}` : 'Your teaching schedule for the week.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading && <p>Loading timetable...</p>}
            {!loading && error && (
              <p className="text-red-500">{error}</p>
            )}

            {!loading && !error && hasGridData && (
              <div className="space-y-3">
                <div className="overflow-x-auto bg-white shadow rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                        {days.map((day) => (
                          <th key={day} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{day}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {timeSlots.map((slotLabel, rowIndex) => {
                        // Check if this row is occupied by a lab from previous row
                        const isSkipRow = days.some((_, dayIndex) => {
                          const prevEntry = (grid[dayIndex] || [])[rowIndex - 1];
                          return Array.isArray(prevEntry) && prevEntry.length > 0 && prevEntry[0]?.is_lab;
                        });
                        
                        if (isSkipRow) return null;
                        
                        return (
                          <tr key={rowIndex}>
                            <td className="px-4 py-3 text-sm text-gray-600 font-medium bg-gray-50 whitespace-nowrap">{slotLabel}</td>
                            {days.map((_, dayIndex) => {
                              const entry = (grid[dayIndex] || [])[rowIndex];
                              const isLabArray = Array.isArray(entry) && entry.length > 0 && entry[0]?.is_lab;
                              const hasData = Array.isArray(entry) ? entry.some(e => e.course || e.room || e.class_name) : (entry?.course || entry?.room || entry?.class_name);
                              
                              if (isLabArray) {
                                // Lab spanning 2 slots
                                return (
                                  <td key={`${rowIndex}-${dayIndex}`} className="px-2 py-3 align-top" rowSpan={2}>
                                    <div className="space-y-2">
                                      <div className="text-xs font-bold text-purple-900 bg-purple-100 px-2 py-1 rounded inline-block">LAB (2 slots)</div>
                                      {(entry as any[]).map((batch, bIdx) => (
                                        <div key={bIdx} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                                          <div className="text-xs font-bold text-purple-800 mb-1">Batch {batch.batch_number || bIdx + 1}</div>
                                          {batch.course && <div className="text-sm font-semibold text-purple-900">{batch.course}</div>}
                                          {batch.class_name && <div className="text-xs text-purple-700">Class: {batch.class_name}</div>}
                                          {batch.room && <div className="text-xs text-purple-700">Room: {batch.room}</div>}
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                );
                              } else if (hasData && !Array.isArray(entry)) {
                                // Regular slot
                                return (
                                  <td key={`${rowIndex}-${dayIndex}`} className="px-4 py-3 align-top">
                                    <div className="p-3 bg-blue-50 rounded-lg">
                                      <div className="text-sm font-semibold text-blue-900">{entry.course}</div>
                                      {entry.class_name && <div className="text-xs text-blue-700">Class: {entry.class_name}</div>}
                                      {entry.room && <div className="text-xs text-blue-700">Room: {entry.room}</div>}
                                    </div>
                                  </td>
                                );
                              } else {
                                // Empty slot
                                return (
                                  <td key={`${rowIndex}-${dayIndex}`} className="px-4 py-3 align-top">
                                    <div className="text-center text-xs text-gray-400">—</div>
                                  </td>
                                );
                              }
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!loading && !error && !hasGridData && (
              timetableUrl ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <a href={timetableUrl} target="_blank" rel="noreferrer">Open in new tab</a>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <a href={timetableUrl} download>Download</a>
                    </Button>
                  </div>
                  {renderTimetable()}
                </div>
              ) : (
                <p className="text-gray-600">No timetable has been uploaded for you yet. Please check back later or contact your administrator.</p>
              )
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default FacultySchedule;
