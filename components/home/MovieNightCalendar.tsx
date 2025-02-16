import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { format, addMonths, subMonths, isSameDay, parseISO, isBefore, startOfDay } from 'date-fns';
import { DatePopularity, DateTimeSelection } from '@/types';

interface MovieNightCalendarProps {
  selectedDates: DateTimeSelection[];
  onDatesSelected: (dates: DateTimeSelection[]) => void;
  datePopularity?: DatePopularity[];
  activeUsername?: string;
  userDates?: { [username: string]: { date: string; hours: string[] | 'all' }[] };
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
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

  const handlePrevMonth = useCallback(() => {
    setCurrentDate(prev => subMonths(prev, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate(prev => addMonths(prev, 1));
  }, []);

  const renderCalendar = useCallback(() => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = getFirstDayOfMonth(currentDate);
    const days = [];
    const today = startOfDay(new Date());

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="w-12 h-12" />);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      const isPastDate = isBefore(date, today);
      const popularity = datePopularity.find(d => isSameDay(parseISO(d.date), date));
      const isActiveUserSelected = selectedDates.some(d => isSameDay(new Date(d.date), date));
      
      const otherUsersSelected = Object.entries(userDates).filter(([username, dates]) => 
        username !== activeUsername && dates.some(d => isSameDay(new Date(d.date), date))
      );

      const totalUsersSelected = otherUsersSelected.length + (isActiveUserSelected ? 1 : 0);

      let className = 'h-10 w-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center relative text-base font-medium transition-all duration-200 ';
      if (isPastDate) {
        className += 'bg-gray-800/30 text-gray-500 cursor-not-allowed';
      } else if (isActiveUserSelected) {
        className += 'bg-gradient-to-br from-primary to-pink-600 text-white shadow-lg';
      } else if (otherUsersSelected.length > 0) {
        className += 'bg-pink-900/30 border-2 border-pink-500/50 text-pink-300 hover:bg-pink-900/50';
      } else {
        className += `hover:bg-pink-900/30 text-gray-300 ${popularity ? `bg-pink-900/${Math.min(popularity.count * 10, 90)}` : 'bg-gray-800/20'}`;
      }
      
      days.push(
        <button
          key={i}
          onClick={() => !isPastDate && handleDateClick(i)}
          className={className}
          title={popularity ? `Selected by: ${popularity.users.join(', ')}` : ''}
          disabled={isPastDate}
        >
          {i}
          {totalUsersSelected > 0 && !isPastDate && (
            <span className="absolute top-0 right-0 text-[10px] font-semibold bg-white text-black rounded-tr-md rounded-bl-md w-4 h-4 flex items-center justify-center shadow-sm">
              {totalUsersSelected}
            </span>
          )}
        </button>
      );
    }

    return days;
  }, [currentDate, datePopularity, selectedDates, userDates, activeUsername, handleDateClick]);

  const renderHours = useCallback(() => {
    if (!selectedDate) return null;
  
    const selectedDateTimes = selectedDates.find(d => isSameDay(new Date(d.date), selectedDate));
    const popularityForDate = datePopularity.find(d => isSameDay(parseISO(d.date), selectedDate));
  
    return (
      <div className="grid grid-cols-4 gap-2">
        {HOURS.map(hour => {
          const hourPopularity = popularityForDate?.hours[hour];
          const isActiveUserSelected = selectedDateTimes?.hours === 'all' || 
            (Array.isArray(selectedDateTimes?.hours) && selectedDateTimes?.hours.includes(hour));
  
          const otherUsersSelected = Object.entries(userDates).filter(([username, dates]) => 
            username !== activeUsername && 
            dates.some(d => isSameDay(new Date(d.date), selectedDate) && 
              (d.hours === 'all' || (Array.isArray(d.hours) && d.hours.includes(hour.toString())))
            )
          );
  
          const totalUsersSelected = otherUsersSelected.length + (isActiveUserSelected ? 1 : 0);
  
          let className = 'h-10 w-10 rounded-lg flex items-center justify-center relative text-sm font-medium transition-all duration-200 ';
          if (isActiveUserSelected) {
            className += 'bg-gradient-to-br from-primary to-pink-600 text-white shadow-lg';
          } else if (otherUsersSelected.length > 0) {
            className += 'bg-pink-900/30 border-2 border-pink-500/50 text-pink-300 hover:bg-pink-900/50';
          } else {
            className += `hover:bg-pink-900/30 text-gray-300 ${hourPopularity ? `bg-pink-900/${Math.min(hourPopularity.count * 10, 90)}` : 'bg-gray-800/20'}`;
          }
  
          return (
            <button
              key={hour}
              onClick={() => handleHourClick(hour)}
              className={className}
              title={hourPopularity ? `Selected by: ${hourPopularity.users.join(', ')}` : ''}
            >
              {hour.toString().padStart(2, '0')}
              {totalUsersSelected > 0 && (
                <span className="absolute top-0 right-0 text-[10px] font-semibold bg-white text-black rounded-tr-md rounded-bl-md w-4 h-4 flex items-center justify-center shadow-sm">
                  {totalUsersSelected}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }, [selectedDate, selectedDates, datePopularity, userDates, activeUsername, handleHourClick]);

  return (
    <div className="mt-2 flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-2">
      <div className="bg-gray-900/60 backdrop-blur-sm p-2 md:p-4 rounded-2xl shadow-xl flex-grow border border-gray-800">
        <div className="flex justify-between items-center mb-6">
          <Button 
            onClick={handlePrevMonth} 
            variant="ghost" 
            className="text-pink-400 hover:bg-pink-900/30 hover:text-pink-300 rounded-xl p-3 transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h3 className="text-xl font-semibold text-transparent bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <Button 
            onClick={handleNextMonth} 
            variant="ghost" 
            className="text-pink-400 hover:bg-pink-900/30 hover:text-pink-300 rounded-xl p-3 transition-all"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {DAYS.map(day => (
            <div key={day} className="text-center font-medium text-pink-400/80 text-sm uppercase tracking-wide">
              {day}
            </div>
          ))}
          {renderCalendar()}
        </div>
        <div className="text-sm text-gray-400 flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-primary/80" />
            <span>Your selection</span>
            <div className="w-3 h-3 rounded-full border-2 border-white/70 ml-4" />
            <span>Others&apos; selections</span>
          </div>
        {selectedDate && (
          <Button 
            onClick={() => setShowHourPicker(!showHourPicker)} 
            className="mt-4 bg-pink-900/20 hover:bg-pink-900/30 text-white w-full py-6 rounded-xl transition-all duration-300 border border-pink-800/50 shadow-sm"
          >
            <Clock className="mr-3 h-5 w-5 text-white" />
            {showHourPicker ? 'Collapse' : 'Select Hours'} for {format(selectedDate, 'MMM d')}
          </Button>
        )}
      </div>
      {selectedDate && showHourPicker && (
        <div className="bg-gray-900/60 backdrop-blur-sm p-2 rounded-2xl shadow-xl border border-gray-800 lg:min-w-[200px]">
          <h3 className="text-lg font-semibold mb-6 text-transparent bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text">
            Available Hours
          </h3>
          {renderHours()}

        </div>
      )}
    </div>
  );
}