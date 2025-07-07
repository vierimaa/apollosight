<script lang="ts">
  import { formatDate } from '$lib/utils/format';
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';

  export let data;
  const { exerciseName, exerciseHistory } = data;

  let chartCanvas: HTMLCanvasElement;
  let chartInstance: Chart;

  interface SetEntry {
    set_index: number;
    weight_kg: number;
    reps: number;
  }

  // Sort history by date ascending
  const sortedHistory = [...data.exerciseHistory].sort(
    (a, b) => new Date(a.workout_date).getTime() - new Date(b.workout_date).getTime()
  );

  // Prepare chart data
  const labels = sortedHistory.map(entry =>
    new Date(entry.workout_date).toLocaleDateString() // or use formatDate if it returns just the date
  );

  const maxWeights = sortedHistory.map(entry =>
    Math.max(...entry.sets.map((set: SetEntry) => set.weight_kg))
  );


  onMount(() => {
    if (chartInstance) {
      chartInstance.destroy();
    }

    if (chartCanvas) {
      chartInstance = new Chart(chartCanvas, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Max Weight (kg)',
              data: maxWeights,
              borderColor: '#1976d2',
              backgroundColor: 'rgba(25, 118, 210, 0.2)',
              tension: 0.2,
              fill: true,
              pointRadius: 4,
              pointHoverRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: true }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    }
  });
</script>

<h1>Exercise: {exerciseName.replace(/-/g, ' ')}</h1>

<div class="chart-container">
  <canvas bind:this={chartCanvas}></canvas>
</div>

{#each exerciseHistory as entry}
  <h2>Date: {formatDate(entry.workout_date)}</h2>
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>Set</th>
          <th>Weight (kg)</th>
          <th>Reps</th>
        </tr>
      </thead>
      <tbody>
        {#each entry.sets as set}
          <tr>
            <td>{+set.set_index + 1}</td>
            <td>{set.weight_kg}</td>
            <td>{set.reps}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/each}

<style>
  h1 {
    margin-bottom: 1.5rem;
    font-size: 2rem;
    color: #2c3e50;
  }

  h2 {
    margin-top: 2rem;
    margin-bottom: 0.5rem;
    font-size: 1.2rem;
    color: #1976d2;
  }

  .chart-container {
    max-width: 640px;
    margin-bottom: 2rem;
  }

  canvas {
    width: 100%;
    height: auto;
  }

  .table-wrapper {
    max-width: 420px;
    margin-bottom: 2rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    background: #fafbfc;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(44, 62, 80, 0.06);
  }

  th,
  td {
    border: 1px solid #e0e7ef;
    padding: 0.5rem 0.75rem;
    text-align: center;
  }

  th {
    background-color: #f5f5f5;
    color: #333;
    font-weight: 600;
  }

  tr:nth-child(even) td {
    background: #f9f9f9;
  }

  tr:hover td {
    background: #e0e7ef;
  }
</style>
