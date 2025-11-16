import * as React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useEffect } from 'react';

interface ClassSchedule {
  courseCode: string;
  professor: string;
  room: string;
  section?: string;
  isHidden?: boolean;
  mergeRows?: number;
}

const Schedule = () => {
  const [department, setDepartment] = React.useState('IT Department');
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const timeSlots = [
    "09:10 AM to 10:10 AM",
    "10:10 AM to 11:10 AM",
    "11:10 AM to 12:10 PM",
    "12:10 PM to 01:10 PM",
    "01:10 PM to 02:10 PM",
    "02:10 PM to 02:20 PM",
    "02:20 PM to 03:20 PM",
    "03:20 PM to 04:20 PM"
  ];

  // IT Department merged cells configuration
  const itMergedCells = [
    { row: 0, col: 1, rowSpan: 2 }, // Tuesday 9:10 to 11:10
    { row: 3, col: 2, rowSpan: 2 }, // Wednesday 12:10 to 2:10
    { row: 3, col: 3, rowSpan: 2 }, // Thursday 12:10 to 2:10
    { row: 6, col: 0, rowSpan: 2 }, // Monday 2:20 to 4:20
    { row: 6, col: 2, rowSpan: 2 }, // Wednesday 2:20 to 4:20
    { row: 6, col: 3, rowSpan: 2 }, // Thursday 2:20 to 4:20
    { row: 6, col: 4, rowSpan: 2 }  // Friday 2:20 to 4:20
  ];

  // IT Department Timetable Data
  const itTimetableData = [
    // Slot 1: 09:10 AM to 10:10 AM
    [
      { courseCode: 'IT265', professor: '(CUR)', room: '125' },
      // Tuesday 9:10-11:10 (merged)
      [
        { section: 'A', courseCode: 'MA262', professor: '(HSJ)', room: '109', mergeRows: 2 },
        { section: 'B', courseCode: 'IT261', professor: '(SYS/ARP)', room: '105', mergeRows: 2 },
        { section: 'C', courseCode: 'MA262', professor: '(HSJ)', room: '110', mergeRows: 2 },
        { section: 'D', courseCode: 'IT265', professor: '(HPM)', room: '108', mergeRows: 2 }
      ],
      { courseCode: 'IT265', professor: '(CUR)', room: '125' },
      { courseCode: 'IT263', professor: '(RVP)', room: '125' },
      { courseCode: 'IT265', professor: '(CUR)', room: '125' },
      null
    ],
    
    // Slot 2: 10:10 AM to 11:10 AM
    [
      { courseCode: 'IT263', professor: '(RVP)', room: '125' },
      { isHidden: true }, // Hidden due to merged cell
      { courseCode: 'IT261', professor: '(ARP)', room: '125' },
      { courseCode: 'MA262', professor: '(VPN)', room: '125' },
      { courseCode: 'MA262', professor: '(VPN)', room: '125' },
      null
    ],
    
    // Slot 3: 11:10 AM to 12:10 PM (Break)
    [null, null, null, null, null, null],
    
    // Slot 4: 12:10 PM to 01:10 PM
    [
      { courseCode: 'IT261', professor: '(ARP)', room: '125' },
      { courseCode: 'IT265', professor: '(CUR)', room: '125' },
      // Wednesday 12:10-2:10 (merged)
      { courseCode: 'IT264', professor: '(DIP PATEL)', room: '229', mergeRows: 2 },
      // Thursday 12:10-2:10 (merged)
      [
        { section: 'A', courseCode: 'IT263', professor: '(PC)', room: '108', mergeRows: 2 },
        { section: 'B', courseCode: 'MA262', professor: '(HSJ)', room: '109', mergeRows: 2 },
        { section: 'C', courseCode: 'IT265', professor: '(CUR)', room: '118', mergeRows: 2 },
        { section: 'D', courseCode: 'IT261', professor: '(SYS)', room: '110', mergeRows: 2 }
      ],
      { courseCode: 'HS111.03 A', professor: '(CD)', room: '125' },
      null
    ],
    
    // Slot 5: 01:10 PM to 02:10 PM
    [
      { courseCode: 'MA262', professor: '(YPF)', room: '125' },
      { courseCode: 'IT263', professor: '(RVP)', room: '125' },
      { isHidden: true }, // Hidden due to merged cell
      { isHidden: true }, // Hidden due to merged cell
      null,
      null
    ],
    
    // Slot 6: 02:10 PM to 02:20 PM (Break)
    [null, null, null, null, null, null],
    
    // Slot 7: 02:20 PM to 03:20 PM
    [
      // Monday 2:20-4:20 (merged)
      [
        { section: 'A', courseCode: 'IT264', professor: '(ADK/RKJ)', room: '107', mergeRows: 2 },
        { section: 'B', courseCode: 'IT265', professor: '(CUR)', room: '118', mergeRows: 2 },
        { section: 'C', courseCode: 'IT261', professor: '(SYS/ARP)', room: '104', mergeRows: 2 },
        { section: 'D', courseCode: 'IT263', professor: '(PC)', room: '106', mergeRows: 2 }
      ],
      { courseCode: 'IT261', professor: '(ARP)', room: '125' },
      // Wednesday 2:20-4:20 (merged)
      [
        { section: 'A', courseCode: 'IT261', professor: '(SYS)', room: '107', mergeRows: 2 },
        { section: 'B', courseCode: 'IT263', professor: '(RVP)', room: '108', mergeRows: 2 },
        { section: 'C', courseCode: 'IT263', professor: '(PC)', room: '109', mergeRows: 2 },
        { section: 'D', courseCode: 'IT264', professor: '(RKJ)', room: '207', mergeRows: 2 }
      ],
      // Thursday 2:20-4:20 (merged)
      [
        { section: 'A', courseCode: 'IT265', professor: '(CUR)', room: '107', mergeRows: 2 },
        { section: 'B', courseCode: 'IT264', professor: '(RKJ)', room: '110', mergeRows: 2 },
        { section: 'C', courseCode: 'IT264', professor: '(RKJ)', room: '108', mergeRows: 2 },
        { section: 'D', courseCode: 'MA262', professor: '(HSJ)', room: '109', mergeRows: 2 }
      ],
      // Friday 2:20-4:20 (merged)
      [
        { section: 'A', courseCode: 'IT266', professor: '(ARP/AJN)', room: '125', mergeRows: 2 },
        { section: 'B', courseCode: 'IT266', professor: '(ARP/AJN)', room: '125', mergeRows: 2 },
        { section: 'C', courseCode: 'IT266', professor: '(RKJ)', room: '125', mergeRows: 2 },
        { section: 'D', courseCode: 'IT266', professor: '(RKJ)', room: '125', mergeRows: 2 }
      ],
      null
    ],
    
    // Slot 8: 03:20 PM to 04:20 PM
    [
      { isHidden: true }, // Hidden due to merged cell
      { courseCode: 'IT263', professor: '(RVP)', room: '125' },
      { isHidden: true }, // Hidden due to merged cell
      { isHidden: true }, // Hidden due to merged cell
      { isHidden: true }, // Hidden due to merged cell
      null
    ]
  ];

  // CE Department Timetable Data
  const ceTimetableData = [
    // Slot 1: 09:10 AM to 10:10 AM
    [
      { courseCode: 'DCN', professor: 'MCD', room: '621' },
      { courseCode: 'DAA', professor: 'VHK', room: '621' },
      // Split cell for Wednesday
      [
        { courseCode: 'PY', professor: 'MLR', room: '628B' },
        { courseCode: 'PY', professor: 'KJM', room: '628B' }
      ],
      { courseCode: 'DCN', professor: 'RPP', room: '621' },
      // Split cell for Friday
      [
        { courseCode: 'SE', professor: 'SAP', room: '617A' },
        { courseCode: 'DAA', professor: 'DAB', room: '628B' }
      ],
      null
    ],
    
    // Slot 2: 10:10 AM to 11:10 AM
    [
      { courseCode: 'DAA', professor: 'NMB', room: '621' },
      { courseCode: 'DCN', professor: 'RPP', room: '621' },
      // Split cell for Wednesday
      [
        { courseCode: 'PY', professor: 'RNP', room: '616A' },
        { courseCode: 'PY', professor: 'DRK', room: '616B' }
      ],
      { courseCode: 'DAA', professor: 'VHK', room: '621' },
      // Split cell for Friday
      [
        { courseCode: 'DCN', professor: 'MCD', room: '616A' },
        { courseCode: 'DBMS', professor: 'MJP', room: '618A' }
      ],
      null
    ],
    
    // Slot 3: 11:10 AM to 12:10 PM (Break)
    [null, null, null, null, null, null],
    
    // Slot 4: 12:10 PM to 01:10 PM - A/C and B/D section approach
    [
      // Monday with sections A/C and B/D
      [
        { section: 'A/C', courseCode: 'DCN', professor: 'MCD', room: '616A' },
        { section: 'B/D', courseCode: 'SE', professor: 'SAP', room: '617A' }
      ],
      // Tuesday with sections A/C and B/D
      [
        { section: 'A/C', courseCode: 'DBMS', professor: 'APC', room: '618A' },
        { section: 'B/D', courseCode: 'DAA', professor: 'DAB', room: '628B' }
      ],
      // Wednesday with sections A/C and B/D
      [
        { section: 'A/C', courseCode: 'DCN', professor: 'MCD', room: '616A' },
        { section: 'B/D', courseCode: 'SE', professor: 'SAP', room: '617A' }
      ],
      // Thursday with sections A/C and B/D
      [
        { section: 'A/C', courseCode: 'DBMS', professor: 'APC', room: '618A' },
        { section: 'B/D', courseCode: 'RJC', professor: '618B' }
      ],
      // Friday with sections A/C and B/D
      [
        { section: 'A/C', courseCode: 'DBMS', professor: 'APC', room: '621' },
        { section: 'B/D', courseCode: 'DBMS', professor: 'SE', room: '621' }
      ],
      // Saturday with sections A and B
      [
        { section: 'A', courseCode: 'A', professor: '', room: '' },
        { section: 'B', courseCode: 'B', professor: '', room: '' }
      ]
    ],
    
    // Slot 5: 01:10 PM to 02:10 PM - A/C and B/D section approach
    [
      // Monday with sections A/C and B/D
      [
        { section: 'A/C', courseCode: 'DBMS', professor: 'APC', room: '618A' },
        { section: 'B/D', courseCode: 'NMB', professor: '628B' }
      ],
      // Tuesday with sections A/C and B/D
      [
        { section: 'A/C', courseCode: 'DAA', professor: 'DAB', room: '628B' },
        { section: 'B/D', courseCode: 'SE', professor: 'SAP', room: '617A' }
      ],
      // Wednesday with sections A/C and B/D
      [
        { section: 'A/C', courseCode: 'DBMS', professor: 'RRP', room: '617A' },
        { section: 'B/D', courseCode: 'DBMS', professor: 'MJP', room: '617B' }
      ],
      // Thursday with sections A/C and B/D
      [
        { section: 'A/C', courseCode: 'DBMS', professor: 'DAA', room: '621' },
        { section: 'B/D', courseCode: 'SAP', professor: 'NMB', room: '621' }
      ],
      // Friday with sections A/C and B/D
      [
        { section: 'C', courseCode: 'C', professor: '', room: '' },
        { section: 'D', courseCode: 'D', professor: '', room: '' }
      ],
      null
    ],
    
    // Slot 6: 02:10 PM to 02:20 PM (Break)
    [null, null, null, null, null, null],
    
    // Slot 7: 02:20 PM to 03:20 PM
    [
      { courseCode: 'SGP', professor: 'RRP', room: '628B' },
      { courseCode: 'SGP', professor: 'DRK', room: '628B' },
      { courseCode: 'DBMS', professor: 'APC', room: '621' },
      { courseCode: 'SE', professor: 'SAP', room: '621' },
      { courseCode: 'DAA', professor: 'DAB', room: '628B' },
      null
    ],
    
    // Slot 8: 03:20 PM to 04:20 PM
    [
      { courseCode: 'SGP', professor: 'MKP', room: '616A' },
      { courseCode: 'DCN', professor: 'MCD', room: '616B' },
      { courseCode: 'HS', professor: 'PB', room: '621' },
      { courseCode: 'HS', professor: 'PB', room: '621' },
      { courseCode: 'SGP', professor: 'SAP', room: '617A' },
      null
    ]
  ];

  // Additional CE rows for DBMS-RJC and SE-SAP rows
  const ceAdditionalRows = [
    { row: 6, col: 4, data: { courseCode: 'DBMS', professor: 'RJC', room: '618A' } },
    { row: 6, col: 5, data: { courseCode: 'SE', professor: 'SAP', room: '621' } },
    { row: 7, col: 4, data: { courseCode: 'SGP', professor: 'AYT', room: '616A' } },
    { row: 7, col: 5, data: { courseCode: 'DCN', professor: 'MCD', room: '621' } }
  ];

  // CSE Department Timetable Data - based on the image provided
  const cseTimetableData = [
    // Slot 1: 09:10 AM to 10:10 AM
    [
      { courseCode: 'CSE207', professor: '(MPD)', room: '323' },
      { courseCode: 'CSE208', professor: '(DDP)', room: '323' },
      // Split cell for Wednesday with Batch information
      [
        { section: 'A', courseCode: 'CSE205', professor: '(GKP)', room: '304' },
        { section: 'B', courseCode: 'CSE207', professor: '(MPD)', room: '313' },
        { section: 'C', courseCode: 'CSE209', professor: '(DDP)', room: '306' },
        { section: 'D', courseCode: 'CSE209', professor: '(PGP)', room: '303' }
      ],
      // Split cell for Thursday with Batch information
      [
        { section: 'A', courseCode: 'CSE206', professor: '(DJR)', room: '312' },
        { section: 'B', courseCode: 'CSE207', professor: '(MPD)', room: '314' },
        { section: 'C', courseCode: 'CSE209', professor: '(VRV)', room: '314' },
        { section: 'D', courseCode: 'CSE209', professor: '(CIP)', room: '303' }
      ],
      // Friday
      { courseCode: 'HS111.03 A', professor: '(KB)', room: '323' },
      // Saturday
      { courseCode: 'Interaction sessions/Counselling', professor: '', room: '' }
    ],
    
    // Slot 2: 10:10 AM to 11:10 AM
    [
      { courseCode: 'CSE205', professor: '(HPP)', room: '323' },
      { courseCode: 'CSE206', professor: '(DJR)', room: '323' },
      null,
      null,
      null,
      { courseCode: 'Interaction sessions/Counselling', professor: '', room: '' }
    ],
    
    // Slot 3: 11:10 AM to 12:10 PM (Break)
    [null, null, null, null, null, null],
    
    // Slot 4: 12:10 PM to 01:10 PM
    [
      // Monday with batch information
      [
        { section: 'A', courseCode: 'CSE209', professor: '(NNP)', room: '313' },
        { section: 'B', courseCode: 'CSE209', professor: '(ARB)', room: '303' },
        { section: 'C', courseCode: 'CSE205', professor: '(BBP)', room: '304' },
        { section: 'D', courseCode: 'CSE206', professor: '(DJR)', room: '312' }
      ],
      { courseCode: 'CSE207', professor: '(MPD)', room: '323' },
      { courseCode: 'Knowledge-sharing Sessions/Interaction sessions/Counselling', professor: '', room: '' },
      // Thursday with batch information
      [
        { section: 'A', courseCode: 'CSE206', professor: '(DJR)', room: '312' },
        { section: 'B', courseCode: 'CSE206', professor: '(ARB)', room: '313' },
        { section: 'C', courseCode: 'CSE208', professor: '(DDP)', room: '303' },
        { section: 'D', courseCode: 'CSE207', professor: '(MPD)', room: '304' }
      ],
      { courseCode: 'Knowledge-sharing Sessions/Interaction sessions/Counselling', professor: '', room: '' },
      // Saturday with batch information
      [
        { section: 'A', courseCode: 'CSE210', professor: '(PSP)', room: '' },
        { section: 'B', courseCode: 'CSE210', professor: '(PNG)', room: '' },
        { section: 'C', courseCode: 'CSE210', professor: '(KMI)', room: '' },
        { section: 'D', courseCode: 'CSE210', professor: '(CIP)', room: '' }
      ]
    ],
    
    // Slot 5: 01:10 PM to 02:10 PM
    [
      null,
      { courseCode: 'CSE205', professor: '(HPP)', room: '323' },
      { courseCode: 'CSE208', professor: '(DDP)', room: '323' },
      null,
      { courseCode: 'CSE206', professor: '(DJR)', room: '323' },
      null
    ],
    
    // Slot 6: 02:10 PM to 02:20 PM (Break)
    [null, null, null, null, null, null],
    
    // Slot 7: 02:20 PM to 03:20 PM
    [
      // Monday with batch information
      [
        { section: 'A', courseCode: 'CSE208', professor: '(DDP)', room: '303' },
        { section: 'B', courseCode: 'CSE208', professor: '(VRV)', room: '304' },
        { section: 'C', courseCode: 'CSE206', professor: '(DJR)', room: '312' },
        { section: 'D', courseCode: 'CSE205', professor: '(BBP)', room: '313' }
      ],
      // Tuesday with batch information
      [
        { section: 'A', courseCode: 'CSE207', professor: '(MPD)', room: '207' },
        { section: 'B', courseCode: 'CSE205', professor: '(GKP)', room: '208' },
        { section: 'C', courseCode: 'CSE209', professor: '(PGP)', room: '313' },
        { section: 'D', courseCode: 'CSE206', professor: '(DJR)', room: '312' }
      ],
      // Wednesday with batch information
      [
        { section: 'A', courseCode: 'CSE209', professor: '(BBP)', room: '303' },
        { section: 'B', courseCode: 'CSE206', professor: '(ARB)', room: '312' },
        { section: 'C', courseCode: 'CSE207', professor: '(MPD)', room: '313' },
        { section: 'D', courseCode: 'CSE208', professor: '(VRV)', room: '304' }
      ],
      { courseCode: 'CSE206', professor: '(DJR)', room: '323' },
      { courseCode: 'CSE208', professor: '(DDP)', room: '323' },
      { courseCode: 'Skill Enhancement Sessions/Training and Placement sessions/Expert talks/Knowledge-sharing Sessions/Interaction sessions/Counselling', professor: '', room: '' }
    ],
    
    // Slot 8: 03:20 PM to 04:20 PM
    [
      null,
      null,
      null,
      { courseCode: 'CSE207', professor: '(MPD)', room: '323' },
      { courseCode: 'CSE205', professor: '(HPP)', room: '323' },
      null
    ]
  ];

  // Function to get current timetable data based on department selection
  const getTimetableData = () => {
    if (department === 'CE Department') {
      return ceTimetableData;
    } else if (department === 'CSE Department') {
      return cseTimetableData;
    } else {
      return itTimetableData;
    }
  };

  // Function to get merged cells configuration based on department selection
  const getMergedCells = () => {
    if (department === 'CE Department' || department === 'CSE Department') {
      return []; // CE and CSE don't use the same merged cell pattern as IT
    } else {
      return itMergedCells;
    }
  };
  
  const renderCell = (cell: any, rowIndex: number, colIndex: number) => {
    // Empty cell
    if (!cell) return null;
    
    // Hidden cell (part of merged cell)
    if (cell.isHidden) return null;

    if (Array.isArray(cell)) {
      // For CE Department - custom rendering for split cells
      if (department === 'CE Department' && (rowIndex === 0 || rowIndex === 1) && (colIndex === 2 || colIndex === 4)) {
        return (
          <div className="space-y-2">
            {cell.map((item, idx) => (
              <div key={idx} className="p-1 text-xs">
                <div className="font-bold text-campusblue-700">{item.courseCode}</div>
                <div className="text-neutral-600">{item.professor}</div>
                <div className="text-neutral-600">{item.room}</div>
              </div>
            ))}
          </div>
        );
      }
      
      // For CE Department - special section rendering for 12:10-2:10 slots
      if (department === 'CE Department' && (rowIndex === 3 || rowIndex === 4)) {
        return (
          <div className="grid grid-cols-2 gap-1">
            {cell.map((section, idx) => (
              <div key={idx} className="p-1 text-xs border-l-2 border-campusblue-500 pl-2">
                <span className="font-bold text-campusblue-700">{section.section}</span>
                <div className="font-medium text-campusblue-700">{section.courseCode}</div>
                <div className="text-neutral-600">{section.professor}</div>
                <div className="text-neutral-600">{section.room}</div>
              </div>
            ))}
          </div>
        );
      }
      
      // For CSE Department - batch rendering for specific slots
      if (department === 'CSE Department') {
        return (
          <div className="space-y-1">
            {cell.map((batch, idx) => (
              <div key={idx} className="p-1 text-xs border-l-2 border-campusblue-500 pl-2">
                <span className="font-bold text-campusblue-700">Batch {batch.section}: {batch.courseCode}</span>
                <div className="text-neutral-600">
                  {batch.professor} {batch.room ? `- ${batch.room}` : ''}
                </div>
              </div>
            ))}
          </div>
        );
      }
      
      // For IT Department - sections A, B, C, D
      const mergeRows = cell[0]?.mergeRows || 1;
      return (
        <div className={`space-y-2 ${mergeRows > 1 ? 'merged-session' : ''}`}>
          {cell.map((section, idx) => (
            <div key={idx} className="p-1 text-xs border-l-2 border-campusblue-500 pl-2">
              <span className="font-bold text-campusblue-700">{section.section}: {section.courseCode}</span>
              <div className="text-neutral-600">
                {section.professor} - {section.room}
              </div>
              {mergeRows > 1 && (
                <div className="mt-1 text-xs text-green-700 font-semibold">
                  {mergeRows}-hour Session
                </div>
              )}
            </div>
          ))}
        </div>
      );
    } else {
      // Regular cell with a single class
      const mergeRows = cell.mergeRows || 1;
      
      // Special rendering for Interaction/Knowledge-sharing sessions (CSE)
      if (department === 'CSE Department' && cell.courseCode && 
          (cell.courseCode.includes('Interaction') || 
           cell.courseCode.includes('Knowledge') || 
           cell.courseCode.includes('Skill Enhancement'))) {
        return (
          <div className="p-1 bg-blue-50 border-l-2 border-blue-500">
            <div className="font-medium text-blue-800 text-xs">{cell.courseCode}</div>
          </div>
        );
      }
      
      // Special rendering for CE standard cells
      if (department === 'CE Department') {
        return (
          <div className="p-1">
            <div className="font-bold text-campusblue-700">{cell.courseCode}</div>
            <div className="text-neutral-600">{cell.professor}</div>
            <div className="text-neutral-600">{cell.room}</div>
          </div>
        );
      }
      
      // CSE Department cell rendering
      if (department === 'CSE Department') {
        return (
          <div className="p-1">
            <div className="font-bold text-campusblue-700">{cell.courseCode}</div>
            <div className="text-neutral-600">{cell.professor} {cell.room ? `- ${cell.room}` : ''}</div>
          </div>
        );
      }
      
      // IT Department cell rendering
      return (
        <div className="p-1">
          <span className="font-bold text-campusblue-700">{cell.courseCode}</span>
          <div className="text-neutral-600">
            {cell.professor} - {cell.room}
          </div>
          {mergeRows > 1 && (
            <div className="mt-1 text-xs text-green-700 font-semibold">
              {mergeRows}-hour Session
            </div>
          )}
        </div>
      );
    }
  };

  // Check if cell should be merged (used for IT Department)
  const isMergedCell = (rowIndex, colIndex) => {
    const mergedCells = getMergedCells();
    return mergedCells.some(cell => 
      cell.row === rowIndex && cell.col === colIndex
    );
  };

  // Find merged cell configuration if exists
  const getMergedCellConfig = (rowIndex, colIndex) => {
    const mergedCells = getMergedCells();
    return mergedCells.find(cell => 
      cell.row === rowIndex && cell.col === colIndex
    );
  };

  // Calculate row span for timetable layout (primarily for IT Department)
  const getRowSpan = (rowIndex, colIndex) => {
    const mergedConfig = getMergedCellConfig(rowIndex, colIndex);
    return mergedConfig ? mergedConfig.rowSpan : 1;
  };

  // Handle department change
  const handleDepartmentChange = (e) => {
    setDepartment(e.target.value);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-campusblue-800">Class Schedule</h1>
            <p className="text-gray-600">Weekly timetable view for academic departments</p>
          </div>
          
          <div className="mb-6">
            <label htmlFor="department" className="block text-gray-700 font-semibold mb-2">
              Select Department:
            </label>
            <select
              id="department"
              className="border-2 border-gray-300 rounded p-2 min-w-[200px]"
              value={department}
              onChange={handleDepartmentChange}
            >
              <option value="IT Department">IT Department</option>
              <option value="CE Department">CE Department</option>
              <option value="CSE Department">CSE Department</option>
            </select>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-x-auto">
            <div className="min-w-[1000px]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-campusblue-700 text-white">
                    <th className="p-2 border border-gray-300 w-[120px]">Time</th>
                    {days.map((day, index) => (
                      <th key={index} className="p-2 border border-gray-300">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((timeSlot, rowIndex) => {
                    // Skip break slots in table
                    if (rowIndex === 2 || rowIndex === 5) {
                      return (
                        <tr key={rowIndex} className="bg-gray-100">
                          <td className="p-2 border border-gray-300 font-medium text-sm">
                            {timeSlot}
                            {(rowIndex === 2 || rowIndex === 5) && 
                             <span className="block text-campusblue-700">(Break)</span>}
                          </td>
                          {days.map((_, colIndex) => (
                            <td key={colIndex} className="p-2 border border-gray-300 text-sm bg-gray-50">
                              {/* No content for break rows */}
                            </td>
                          ))}
                        </tr>
                      );
                    }
                    
                    return (
                      <tr key={rowIndex}>
                        <td className="p-2 border border-gray-300 font-medium">
                          {timeSlot}
                        </td>
                        {days.map((_, colIndex) => {
                          // Check if this cell should be rendered or is part of a merged cell
                          const timetableData = getTimetableData();
                          
                          // Skip this cell if it's covered by a previous cell's rowspan
                          if (department === 'IT Department') {
                            // For IT Department, use merged cell logic
                            if (rowIndex > 0 && isMergedCell(rowIndex - 1, colIndex)) {
                              const prevMergedConfig = getMergedCellConfig(rowIndex - 1, colIndex);
                              if (prevMergedConfig && prevMergedConfig.rowSpan > 1) {
                                if (rowIndex < prevMergedConfig.row + prevMergedConfig.rowSpan) {
                                  return null;
                                }
                              }
                            }
                            
                            const rowSpan = getRowSpan(rowIndex, colIndex);
                            
                            return (
                              <td 
                                key={colIndex} 
                                className="border border-gray-300 text-xs"
                                rowSpan={rowSpan}
                              >
                                {renderCell(timetableData[rowIndex][colIndex], rowIndex, colIndex)}
                              </td>
                            );
                          } else {
                            // For CE and CSE Departments, regular cell rendering
                            return (
                              <td 
                                key={colIndex} 
                                className="border border-gray-300 text-xs"
                              >
                                {renderCell(timetableData[rowIndex][colIndex], rowIndex, colIndex)}
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
          
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-campusblue-800">Legend</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-700"></div>
                <span>Multi-hour Sessions</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-l-4 border-campusblue-500"></div>
                <span>Section-specific Classes</span>
              </div>
              {department === 'CSE Department' && (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-50 border-l-2 border-blue-500"></div>
                  <span>Special Sessions</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Schedule;

              