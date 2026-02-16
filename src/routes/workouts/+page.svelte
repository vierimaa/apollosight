<script lang="ts">
  import { formatDate } from "$lib/utils/format";
  let { data } = $props();

  interface Workout {
    uuid: string;
    title: string;
    start_time: string;
  }

  interface CalendarDay {
    date: string;
    count: number;
  }

  // Group workouts by date for the heatmap
  const getWorkoutCountsByDate = () => {
    const counts = new Map<string, number>();
    
    data.jsonData.forEach((workout: Workout) => {
      const date = new Date(workout.start_time).toISOString().split('T')[0];
      counts.set(date, (counts.get(date) || 0) + 1);
    });
    
    return counts;
  };

  // Generate calendar data for the last year
  const generateCalendarData = () => {
    const today = new Date();
    const workoutCounts = getWorkoutCountsByDate();
    const days: CalendarDay[] = [];
    
    // Get days for the last year
    for (let i = 0; i < 371; i++) { // 53 weeks * 7 days to ensure full weeks
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        count: workoutCounts.get(dateStr) || 0
      });
    }
    
    // Pad the beginning to align with the week (Monday = 1, Sunday = 0)
    const firstDay = new Date(days[days.length - 1].date);
    let dayOfWeek = firstDay.getDay() - 1;
    if (dayOfWeek === -1) dayOfWeek = 6; // Convert Sunday from 0 to 6
    
    // Add padding days at the start to align with Monday
    for (let i = 0; i < dayOfWeek; i++) {
      const paddingDate = new Date(firstDay);
      paddingDate.setDate(paddingDate.getDate() - (i + 1));
      days.push({
        date: paddingDate.toISOString().split('T')[0],
        count: 0
      });
    }
    
    return days.reverse();
  };

  const activityData = $derived(generateCalendarData());

  // Helper to get color based on workout count
  const getBackgroundColor = (count: number) => {
    return count > 0 ? '#40c463' : '#ebedf0';
  };
</script>

<h1>Workout data</h1>
<p>Total workouts: {data.jsonData.length}</p>

<div class="activity-calendar">
  <div class="calendar-container">
    <div class="weekdays">
      <div>Mon</div>
      <div>Wed</div>
      <div>Fri</div>
      <div>Sun</div>
    </div>

    <div class="contribution-graph">
      <div class="months">
        {#each activityData
          .filter((_, i) => i % 7 === 0) // Get first day of each week
          .filter((day, i) => { // Get approximate month starts
            const date = new Date(day.date);
            const prevDate = i > 0 ? new Date(activityData[Math.max(0, i * 7 - 7)].date) : null;
            return !prevDate || date.getMonth() !== prevDate.getMonth();
          })
          .map(day => {
            const date = new Date(day.date);
            return {
              name: date.toLocaleString('default', { month: 'short' }),
              weekIndex: Math.floor(activityData.findIndex(d => d.date === day.date) / 7)
            };
          }) as month}
          <div class="month-label" style="grid-column-start: {month.weekIndex + 1}">
            {month.name}
          </div>
        {/each}
      </div>
      
      <div class="calendar-grid">
        {#each activityData as day}
          <div 
            class="day" 
            style="background-color: {getBackgroundColor(day.count)}"
            title="{day.date}: {day.count} workout{day.count !== 1 ? 's' : ''}"
          ></div>
        {/each}
      </div>
    </div>
  </div>

  <div class="legend">
    <div class="legend-item" style="background-color: {getBackgroundColor(0)}"></div>
    <span>Rest day</span>
    <div class="legend-item" style="background-color: {getBackgroundColor(1)}"></div>
    <span>Workout</span>
  </div>
</div>

<h2>Workout Sessions</h2>
<ul>
  {#each data.jsonData as workout}
    <li>
      <a href={`/workouts/${workout.uuid}`}>
        {workout.title} — {formatDate(workout.start_time)}
      </a>
    </li>
  {/each}
</ul>

<style>
  .activity-calendar {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 2rem auto;
    padding: 1rem;
    background: #fff;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    font-size: 0.8rem;
    width: fit-content;
  }

  .calendar-container {
    display: flex;
    gap: 4px;
  }

  .weekdays {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 32px 4px 0 0;
    color: #586069;
    text-align: end;
    font-size: 0.7rem;
    height: 119px;
  }

  .contribution-graph {
    flex: 1;
  }

  .months {
    display: grid;
    grid-template-columns: repeat(53, 15px);
    gap: 2px;
    padding-bottom: 4px;
    justify-content: center;
  }

  .month-label {
    color: #586069;
    font-size: 0.7rem;
    position: relative;
    grid-column-end: span 4;
    text-align: start;
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(53, 15px);
    grid-auto-flow: column;
    grid-template-rows: repeat(7, 15px);
    gap: 2px;
    justify-content: center;
  }

  .legend {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    color: #586069;
    justify-content: center;
    margin-top: 0.5rem;
    font-size: 0.7rem;
  }

  .legend-item {
    width: 10px;
    height: 10px;
    border-radius: 2px;
  }

  .day {
    width: 15px;
    height: 15px;
    border-radius: 2px;
    transition: transform 0.1s ease-in-out;
  }

  .day:hover {
    transform: scale(1.2);
  }

  ul {
    list-style: none;
    padding: 0;
    max-width: 800px;
    margin: 0 auto;
  }

  li {
    margin-bottom: 0.5rem;
  }

  a {
    color: #1976d2;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  h1, h2, p {
    text-align: center;
  }
</style>
