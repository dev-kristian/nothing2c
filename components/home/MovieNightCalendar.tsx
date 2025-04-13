import React, { useState, useCallback, useEffect, } from 'react';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { addMonths, subMonths, isSameDay, isBefore, startOfDay, isToday } from 'date-fns'; 
import { DatePopularity, DateTimeSelection, UserDate } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { getUTCDayEpochFromDate, getUTCHourEpochFromDateAndHour } from '@/lib/dateTimeUtils';
import { Session } from '@/types'; // Import Session type

interface MovieNightCalendarProps {
  selectedDates: DateTimeSelection[];
  onDatesSelected: (dates: DateTimeSelection[]) => void;
  datePopularity?: DatePopularity[];
  activeUserId?: string; // Changed from activeUsername
  userDates?: { [userId: string]: UserDate[] }; // Changed key to userId
  participants: Session['participants']; // Added participants prop
  isReadOnly?: boolean;
}


const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function MovieNightCalendar({
  selectedDates,
  onDatesSelected,
  datePopularity = [],
  activeUserId, // Changed from activeUsername
  userDates = {},
  participants, // Added participants
  isReadOnly = false
}: MovieNightCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [animation, setAnimation] = useState<'left' | 'right' | null>(null);
  useEffect(() => {
    if (animation) {
      const timer = setTimeout(() => setAnimation(null), 300);
      return () => clearTimeout(timer);
    }
  }, [animation]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getUTCDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDateClick = useCallback((day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const existingSelection = selectedDates.find((d: DateTimeSelection) => isSameDay(new Date(d.date), newDate));
    if (selectedDate && isSameDay(newDate, selectedDate)) {
      setSelectedDate(null);
      const nextSelectedDates = selectedDates.filter((d: DateTimeSelection) => !isSameDay(new Date(d.date), newDate));
      onDatesSelected(nextSelectedDates);
    } else {
      setSelectedDate(newDate);
      if (!existingSelection) {
        const allHoursArray = Array.from({ length: 24 }, (_, i) => i);
        const nextSelectedDates = [...selectedDates, { date: newDate, hours: allHoursArray }];
        onDatesSelected(nextSelectedDates);
      }
    }
  }, [currentDate, selectedDates, onDatesSelected, selectedDate]);
  const handleHourClick = useCallback((hour: number) => {
    if (isReadOnly || !selectedDate) return;
    let nextSelectedDates: DateTimeSelection[];
    const existingSelectionIndex = selectedDates.findIndex((d: DateTimeSelection) => isSameDay(new Date(d.date), selectedDate));
    if (existingSelectionIndex > -1) {
      const existingSelection = selectedDates[existingSelectionIndex];
      let newHours: number[];
      const allHoursSelected = Array.isArray(existingSelection.hours) && existingSelection.hours.length === 24;
      if (allHoursSelected) {
        newHours = [hour];
        const updatedDates = [...selectedDates];
        updatedDates[existingSelectionIndex] = { ...existingSelection, hours: newHours };
        nextSelectedDates = updatedDates;
      } else if (Array.isArray(existingSelection.hours)) {
        if (existingSelection.hours.includes(hour)) {
          newHours = existingSelection.hours.filter((h: number) => h !== hour);
          if (newHours.length === 0) {
            nextSelectedDates = selectedDates.filter((_: DateTimeSelection, index: number) => index !== existingSelectionIndex);
            setSelectedDate(null);
          } else {
            const updatedDates = [...selectedDates];
            updatedDates[existingSelectionIndex] = { ...existingSelection, hours: newHours };
            nextSelectedDates = updatedDates;
          }
        } else {
          newHours = [...existingSelection.hours, hour].sort((a: number, b: number) => a - b);
          const updatedDates = [...selectedDates];
          updatedDates[existingSelectionIndex] = { ...existingSelection, hours: newHours };
          nextSelectedDates = updatedDates;
        }
      } else {
        console.warn("Existing selection hours was not an array:", existingSelection.hours);
        newHours = [hour];
        const updatedDates = [...selectedDates];
        updatedDates[existingSelectionIndex] = { ...existingSelection, hours: newHours };
        nextSelectedDates = updatedDates;
      }
    } else {
      nextSelectedDates = [...selectedDates, { date: selectedDate, hours: [hour] }];
    }
    onDatesSelected(nextSelectedDates);
  }, [selectedDate, isReadOnly, selectedDates, onDatesSelected]);
  const handleSelectAllHours = useCallback(() => {
    if (isReadOnly || !selectedDate) return;
    let nextSelectedDates: DateTimeSelection[];
    const existingSelectionIndex = selectedDates.findIndex((d: DateTimeSelection) => isSameDay(new Date(d.date), selectedDate));
    const allHoursArray = Array.from({ length: 24 }, (_, i) => i);

    if (existingSelectionIndex > -1) {
      const updatedDates = [...selectedDates];
      updatedDates[existingSelectionIndex] = { ...updatedDates[existingSelectionIndex], hours: allHoursArray };
      nextSelectedDates = updatedDates;
    } else {
      nextSelectedDates = [...selectedDates, { date: selectedDate, hours: allHoursArray }];
    }
    onDatesSelected(nextSelectedDates);
  }, [selectedDate, isReadOnly, selectedDates, onDatesSelected]);

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
      const currentDayEpoch = getUTCDayEpochFromDate(date);
      // Filter using userId now
      const otherUsersSelected = Object.entries(userDates).filter(([userId, epochDates]) => {
          if (userId === activeUserId || !Array.isArray(epochDates)) return false;
          return epochDates.some(d => d && typeof d.dateEpoch === 'number' && d.dateEpoch === currentDayEpoch);
      });

      const totalUsersSelected = otherUsersSelected.length + (isActiveUserSelected ? 1 : 0);

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
          disabled={isReadOnly || isPastDate}
          whileHover={!isReadOnly && !isPastDate ? { scale: 1.1 } : {}}
          whileTap={!isReadOnly && !isPastDate ? { scale: 0.95 } : {}}
        >
          {i}
          {totalUsersSelected > 0 && !isPastDate && (
            <span className="absolute top-0 right-0 text-xs bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-bl-md rounded-tr-md px-1 py-0.5 flex items-center justify-center shadow-sm">
              {totalUsersSelected}
            </span>
          )}
        </motion.button>
      );
    }
    return days;
    // Update dependency array
  }, [currentDate, selectedDates, userDates, activeUserId, handleDateClick, isReadOnly]);

  const renderHours = useCallback(() => {
    if (!selectedDate) return null;
    const selectedDayEpoch = getUTCDayEpochFromDate(selectedDate);
    const popularityForDate = datePopularity?.find(d => d && typeof d.dateEpoch === 'number' && d.dateEpoch === selectedDayEpoch);
    const amHours = HOURS.slice(0, 12);
    const pmHours = HOURS.slice(12);
    
    const renderHourGroup = (hours: number[]) => (
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {hours.map(hour => {
          const targetHourEpoch = getUTCHourEpochFromDateAndHour(selectedDate, hour); 
          const hourPopularityData = popularityForDate?.hours?.[hour.toString()];
          const activeUserSelection = selectedDates.find(d => isSameDay(new Date(d.date), selectedDate));
          const isActiveUserSelected = activeUserSelection ?
              (Array.isArray(activeUserSelection.hours) && activeUserSelection.hours.includes(hour))
              : false;

          // Filter using userId now
          const otherUsersSelected = Object.entries(userDates).filter(([userId, epochDates]) => {
            if (userId === activeUserId || !Array.isArray(epochDates)) return false;
            const dateEntry = epochDates.find(d => d && typeof d.dateEpoch === 'number' && d.dateEpoch === selectedDayEpoch);
            if (!dateEntry || !Array.isArray(dateEntry.hoursEpoch)) return false;
            return dateEntry.hoursEpoch.includes(targetHourEpoch);
          });
          const totalUsersSelected = otherUsersSelected.length + (isActiveUserSelected ? 1 : 0);

          // Map userIds from popularity data to usernames for display
          const userNamesForHour = hourPopularityData?.users
            .map(uid => participants[uid]?.username || 'Unknown') // Map userId to username
            .filter(name => name !== 'Unknown') // Filter out if user not found in participants
            .join(', ') || '';

          const hourDisplay = hour === 0 ? '12am' :
                             hour < 12 ? `${hour}am` : 
                             hour === 12 ? '12pm' : 
                             `${hour-12}pm`;
          
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
              disabled={isReadOnly}
              // Display usernames in title
              title={userNamesForHour ? `Selected by: ${userNamesForHour}` : ''}
              whileHover={!isReadOnly ? { scale: 1.05 } : {}}
              whileTap={!isReadOnly ? { scale: 0.95 } : {}}
            >
              {hourDisplay}
              {totalUsersSelected > 0 && ( 
                <span className="absolute top-0 right-0 text-xs bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-bl-md rounded-tr-md px-1 py-0.5 flex items-center justify-center shadow-sm">
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
          <h4 className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">Morning</h4>
          {renderHourGroup(amHours)}
        </div>
        <div>
          <h4 className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">Afternoon & Evening</h4>
          {renderHourGroup(pmHours)}
        </div>
      </div>
    );
    // Update dependency array
  }, [selectedDate, selectedDates, datePopularity, userDates, activeUserId, participants, handleHourClick, isReadOnly]);

  return (
    <div className="mt-4 flex flex-col lg:flex-row gap-4">
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
              {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
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
            <span>Others' selections</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue/20" />
            <span>Today</span>
          </div>
        </div>
        
      </motion.div>
      
      {selectedDate && ( 
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
              {selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </div>
          </div>
          
          <div className="mb-4">
            {renderHours()}
          </div>
          
          <div className="flex gap-2 mt-4">
            <motion.button
              onClick={handleSelectAllHours}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-medium button-neutral flex items-center justify-center"
              disabled={isReadOnly}
              whileHover={!isReadOnly ? { scale: 1.02 } : {}} 
              whileTap={!isReadOnly ? { scale: 0.98 } : {}}
            >
              <Check className="w-3 h-3 mr-1" />
              All Hours
            </motion.button>
            
          </div>
        </motion.div>
      )}
    </div>
  );
}
