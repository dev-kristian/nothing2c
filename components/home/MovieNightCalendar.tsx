import React, { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Check, X } from 'lucide-react';
import { format, addMonths, subMonths, isSameDay, parseISO, isBefore, startOfDay, isToday } from 'date-fns';
import { DatePopularity, DateTimeSelection } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface MovieNightCalendarProps {
  selectedDates: DateTimeSelection[];
  onDatesSelected: (dates: DateTimeSelection[]) => void;
  datePopularity?: DatePopularity[];
  activeUsername?: string;
  userDates?: { [username: string]: { date: string; hours: string[] | 'all' }[] };
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function MovieNightCalendar({
  selectedDates,
  onDatesSelected,
  datePopularity = [],
  activeUsername,
  userDates = {}
}: MovieNightCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showHourPicker, setShowHourPicker] = useState(false);
  const [animation, setAnimation] = useState<'left' | 'right' | null>(null);

  // Reset animation after it completes
  useEffect(() => {
    if (animation) {
      const timer = setTimeout(() => setAnimation(null), 300);
      return () => clearTimeout(timer);
    }
  }, [animation]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDateClick = useCallback((day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
    
    const existingSelection = selectedDates.find(d => isSameDay(new Date(d.date), newDate));
    let newSelectedDates: DateTimeSelection[];

    if (existingSelection) {
      newSelectedDates = selectedDates.filter(d => !isSameDay(new Date(d.date), newDate));
    } else {
      newSelectedDates = [...selectedDates, { date: newDate, hours: 'all' }];
    }

    onDatesSelected(newSelectedDates);
  }, [currentDate, selectedDates, onDatesSelected]);

  const handleHourClick = useCallback((hour: number) => {
    if (!selectedDate) return;
  
    const existingSelection = selectedDates.find(d => isSameDay(new Date(d.date), selectedDate));
    let newSelectedDates: DateTimeSelection[];
  
    if (existingSelection) {
      if (existingSelection.hours === 'all') {
        newSelectedDates = selectedDates.map(d => 
          isSameDay(new Date(d.date), selectedDate) 
            ? { ...d, hours: [hour] } 
            : d
        );
      } else if (Array.isArray(existingSelection.hours)) {
        if (existingSelection.hours.includes(hour)) {
          const newHours = existingSelection.hours.filter(h => h !== hour);
          if (newHours.length === 0) {
            newSelectedDates = selectedDates.filter(d => !isSameDay(new Date(d.date), selectedDate));
          } else {
            newSelectedDates = selectedDates.map(d => 
              isSameDay(new Date(d.date), selectedDate) 
                ? { ...d, hours: newHours } 
                : d
            );
          }
        } else {
          newSelectedDates = selectedDates.map(d => 
            isSameDay(new Date(d.date), selectedDate) 
              ? { ...d, hours: [...d.hours as number[], hour] } 
              : d
          );
        }
      } else {
        newSelectedDates = [...selectedDates];
      }
    } else {
      newSelectedDates = [...selectedDates, { date: selectedDate, hours: [hour] }];
    }
  
    onDatesSelected(newSelectedDates);
  }, [selectedDate, selectedDates, onDatesSelected]);

  const handleSelectAllHours = useCallback(() => {
    if (!selectedDate) return;
    
    const existingSelection = selectedDates.find(d => isSameDay(new Date(d.date), selectedDate));
    let newSelectedDates: DateTimeSelection[];
    
    if (existingSelection) {
      newSelectedDates = selectedDates.map(d => 
        isSameDay(new Date(d.date), selectedDate) 
          ? { ...d, hours: 'all' } 
          : d
      );
    } else {
      newSelectedDates = [...selectedDates, { date: selectedDate, hours: 'all' }];
    }
    
    onDatesSelected(newSelectedDates);
  }, [selectedDate, selectedDates, onDatesSelected]);

  const handleClearSelection = useCallback(() => {
    if (!selectedDate) return;
    
    onDatesSelected(selectedDates.filter(d => !isSameDay(new Date(d.date), selectedDate)));
    setShowHourPicker(false);
  }, [selectedDate, selectedDates, onDatesSelected]);

  const handlePrevMonth = useCallback(() => {
    setAnimation('left');
    setCurrentDate(prev => subMonths(prev, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setAnimation('right');
    setCurrentDate(prev => addMonths(prev, 1));
  }, []);

  const renderCalendar = useCallback(() => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = getFirstDayOfMonth(currentDate);
    const days = [];
    const today = startOfDay(new Date());

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="w-10 h-10" />);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      const isPastDate = isBefore(date, today);
      const isCurrentDay = isToday(date);
      const isActiveUserSelected = selectedDates.some(d => isSameDay(new Date(d.date), date));
      
      const otherUsersSelected = Object.entries(userDates).filter(([username, dates]) => 
        username !== activeUsername && dates.some(d => isSameDay(new Date(d.date), date))
      );

      const totalUsersSelected = otherUsersSelected.length + (isActiveUserSelected ? 1 : 0);

      // Determine cell styling based on state
      let dayClasses = 'h-10 w-10 lg:w-12 lg:h-12 rounded-md flex items-center justify-center relative text-base font-medium transition-all duration-200 ';
      
      if (isPastDate) {
        dayClasses += "opacity-40 cursor-not-allowed text-gray dark:text-gray-dark";
      } else if (isActiveUserSelected) {
        dayClasses += "bg-pink dark:bg-pink-dark text-white";
      } else if (otherUsersSelected.length > 0) {
        dayClasses += "border border-pink dark:border-pink-dark text-pink dark:text-pink-dark";
      } else if (isCurrentDay) {
        dayClasses += "bg-blue/20 dark:bg-blue-dark/20 text-blue dark:text-blue-dark font-medium";
      } else {
        dayClasses += "hover:bg-gray/80 dark:hover:bg-gray/40 text-gray dark:text-gray-dark";
      }
      
      days.push(
        <motion.button
          key={i}
          onClick={() => !isPastDate && handleDateClick(i)}
          className={dayClasses}
          disabled={isPastDate}
          whileHover={!isPastDate ? { scale: 1.1 } : {}}
          whileTap={!isPastDate ? { scale: 0.95 } : {}}
        >
          {i}
          {totalUsersSelected > 0 && !isPastDate && (
            <span className="absolute top-0 right-0 text-xs bg-white text-gray rounded-bl-sm rounded-tr-sm w-3 lg:w-4 h-3 lg:h-4 flex items-center justify-center">
              {totalUsersSelected}
            </span>
          )}
        </motion.button>
      );
    }

    return days;
  }, [currentDate, selectedDates, userDates, activeUsername, handleDateClick]);

  const renderHours = useCallback(() => {
    if (!selectedDate) return null;
  
    const selectedDateTimes = selectedDates.find(d => isSameDay(new Date(d.date), selectedDate));
    const popularityForDate = datePopularity.find(d => isSameDay(parseISO(d.date), selectedDate));
    const hourPopularityDetails = popularityForDate?.hourlyDetails; // Use hourlyDetails
    const isAllHoursSelected = selectedDateTimes?.hours === 'all';
    
    // Group hours by AM/PM
    const amHours = HOURS.slice(0, 12);
    const pmHours = HOURS.slice(12);
    
    const renderHourGroup = (hours: number[]) => (
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {hours.map(hour => {
          const hourPopularity = hourPopularityDetails?.[hour]; // Access details for the specific hour
          const isActiveUserSelected = isAllHoursSelected || 
            (Array.isArray(selectedDateTimes?.hours) && selectedDateTimes?.hours.includes(hour));
  
          // Check if other users have selected this specific hour
          const otherUsersSelected = Object.entries(userDates).filter(([username, dates]) => {
            if (username === activeUsername) return false;
            
            return dates.some(d => {
              if (!isSameDay(new Date(d.date), selectedDate)) return false;
              
              if (d.hours === 'all') return true;
              
              if (Array.isArray(d.hours)) {
                // Check if this specific hour is in the user's selected hours
                return d.hours.some(h => {
                  // Handle both number and string hour formats
                  if (typeof h === 'number') return h === hour;
                  if (typeof h === 'string') {
                    try {
                      const hourFromString = new Date(h).getHours();
                      return hourFromString === hour;
                    } catch { // Remove unused 'e'
                      // Attempt to parse as integer if Date parsing fails
                      const parsedInt = parseInt(h);
                      return !isNaN(parsedInt) && parsedInt === hour;
                    }
                  }
                  return false;
                });
              }
              
              return false;
            });
          });
  
          const totalUsersSelected = otherUsersSelected.length + (isActiveUserSelected ? 1 : 0);
          
          // Format hour display
          const hourDisplay = hour === 0 ? '12am' : 
                             hour < 12 ? `${hour}am` : 
                             hour === 12 ? '12pm' : 
                             `${hour-12}pm`;
          
          // Hour styling based on selection state
          let hourClasses = "h-10 rounded-md flex items-center justify-center text-sm font-medium transition-all duration-200 relative ";
          
          if (isActiveUserSelected) {
            hourClasses += "bg-pink dark:bg-pink-dark text-white";
          } else if (otherUsersSelected.length > 0) {
            hourClasses += "border border-pink dark:border-pink-dark text-pink dark:text-pink-dark";
          } else {
            hourClasses += "hover:bg-gray/80 dark:hover:bg-gray/40 text-gray dark:text-gray-dark";
          }
          
          return (
            <motion.button
              key={hour}
              onClick={() => handleHourClick(hour)}
              className={hourClasses}
              title={hourPopularity ? `Selected by: ${hourPopularity.users.join(', ')}` : ''} // Use defined type
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {hourDisplay}
              {totalUsersSelected > 0 && (
                <span className="absolute top-0 right-0 text-xs bg-white text-gray rounded-bl-sm rounded-tr-sm w-3 lg:w-4 h-3 lg:h-4 flex items-center justify-center">
                  {totalUsersSelected}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    );
  
    return (
      <div className="space-y-4">
        <div>
          <h4 className="text-sm text-gray dark:text-gray-dark mb-2 font-medium">Morning</h4>
          {renderHourGroup(amHours)}
        </div>
        <div>
          <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-medium">Afternoon & Evening</h4>
          {renderHourGroup(pmHours)}
        </div>
      </div>
    );
  }, [selectedDate, selectedDates, datePopularity, userDates, activeUsername, handleHourClick]);
  

  return (
    <div className="mt-4 flex flex-col lg:flex-row gap-4">
      {/* Calendar Panel */}
      <motion.div 
        className="frosted-panel p-4 flex-grow"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center mb-4">
          <motion.button 
            onClick={handlePrevMonth}
            className=" flex items-center justify-center icon-button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          
          <AnimatePresence mode="wait">
            <motion.h3 
              key={`${currentDate.getMonth()}-${currentDate.getFullYear()}`}
              className="text-base font-medium bg-gray-600 dark:bg-white bg-clip-text text-transparent"
              initial={{ opacity: 0, x: animation === 'left' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: animation === 'left' ? -20 : 20 }}
              transition={{ duration: 0.3 }}
            >
              {format(currentDate, 'MMMM yyyy')}
            </motion.h3>
          </AnimatePresence>
          
          <motion.button 
            onClick={handleNextMonth}
            className=" flex items-center justify-center icon-button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 pb-4">
          {DAYS.map(day => (
            <div key={day} className="pl-4 text-xs font-medium text-gray-500 dark:text-gray-400">
              {day}
            </div>
          ))}
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={`${currentDate.getMonth()}-${currentDate.getFullYear()}`}
            className="grid grid-cols-7 gap-1"
            initial={{ opacity: 0, x: animation === 'left' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: animation === 'left' ? -20 : 20 }}
            transition={{ duration: 0.3 }}
          >
            {renderCalendar()}
          </motion.div>
        </AnimatePresence>
        
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-pink dark:bg-pink-dark" />
            <span>Your selection</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full border border-pink dark:border-pink-dark" />
            <span>Others&apos; selections</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue/20" />
            <span>Today</span>
          </div>
        </div>
        
        {selectedDate && (
          <motion.button 
            onClick={() => setShowHourPicker(!showHourPicker)} 
            className="mt-4 py-2 px-4 rounded-xl text-sm font-medium button-neutral w-full flex items-center justify-center "
          >
            <Clock className="mr-2 h-4 w-4" />
            {showHourPicker ? 'Hide Hours' : 'Select Hours'} for {format(selectedDate, 'MMM d')}
          </motion.button>
        )}
      </motion.div>
      
      {/* Hour Selection Panel */}
      {selectedDate && showHourPicker && (
        <motion.div 
          className="frosted-panel p-4 lg:w-[400px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray dark:text-gray-dark font-small">
              Available Hours
            </h3>
            <div className="text-sm text-gray dark:text-gray-dark">
              {format(selectedDate, 'MMM d')}
            </div>
          </div>
          
          <div className="mb-4">
            {renderHours()}
          </div>
          
          <div className="flex gap-2 mt-4">
            <motion.button
              onClick={handleSelectAllHours}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-medium button-neutral flex items-center justify-center"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Check className="w-3 h-3 mr-1" />
              All Hours
            </motion.button>
            
            <motion.button
              onClick={handleClearSelection}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-medium button-neutral flex items-center justify-center"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
