<script lang="ts">
  import { formatDate } from "$lib/utils/format";
  import Chart from "chart.js/auto";

  const { data } = $props();
  const { exerciseName, exerciseHistory } = data;

  let maxWeightCanvas: HTMLCanvasElement;
  let oneRepMaxCanvas: HTMLCanvasElement;
  // let setVolumeCanvas: HTMLCanvasElement;
  // let sessionVolumeCanvas: HTMLCanvasElement;
  // let sessionRepsCanvas: HTMLCanvasElement;

  let maxWeightChart: Chart | undefined;
  let oneRepMaxChart: Chart | undefined;
  // let setVolumeChart: Chart;
  // let sessionVolumeChart: Chart;
  // let sessionRepsChart: Chart;

  interface SetEntry {
    set_index: number;
    weight_kg: number;
    reps: number;
  }

  // Sort history by date ascending
  const sortedHistory = [...data.exerciseHistory].sort(
    (a, b) =>
      new Date(a.workout_date).getTime() - new Date(b.workout_date).getTime()
  );

  // Prepare chart data
  const labels = sortedHistory.map(
    (entry) => new Date(entry.workout_date).toLocaleDateString() // or use formatDate if it returns just the date
  );

  const maxWeights = sortedHistory.map((entry) =>
    Math.max(...entry.sets.map((set: SetEntry) => set.weight_kg))
  );

  const oneRepMax = sortedHistory.map((entry) =>
    Math.max(
      ...entry.sets.map(
        (set: SetEntry) => set.weight_kg * (1 + 0.0333 * set.reps)
      )
    )
  );

  const setVolume = sortedHistory.map((entry) =>
    Math.max(...entry.sets.map((set: SetEntry) => set.weight_kg * set.reps))
  );

  const sessionVolume = sortedHistory.map((entry) =>
    entry.sets.reduce(
      (total: number, set: SetEntry) => total + set.weight_kg * set.reps,
      0
    )
  );

  const sessionReps = sortedHistory.map((entry) =>
    entry.sets.reduce((total: number, set: SetEntry) => total + set.reps, 0)
  );

  const chartDefinitions = [
    {
      id: "maxWeight",
      canvasRef: () => maxWeightCanvas,
      instanceRef: (chart?: Chart) => {
        if (chart !== undefined) maxWeightChart = chart;
        return maxWeightChart;
      },
      label: "Max Weight (kg)",
      data: maxWeights,
      borderColor: "#1976d2",
      backgroundColor: "rgba(25, 118, 210, 0.2)",
    },
    {
      id: "oneRepMax",
      canvasRef: () => oneRepMaxCanvas,
      instanceRef: (chart?: Chart) => {
        if (chart !== undefined) oneRepMaxChart = chart;
        return oneRepMaxChart;
      },
      label: "One Rep Max (kg)",
      data: oneRepMax,
      borderColor: "#4caf50",
      backgroundColor: "rgba(76, 175, 80, 0.2)",
    },
  ];

  function destroyChart(chart: Chart | undefined) {
    if (chart && typeof chart.destroy === "function") {
      chart.destroy();
    }
  }

  function createChart({
    canvas,
    label,
    data,
    borderColor,
    backgroundColor,
  }: {
    canvas: HTMLCanvasElement;
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }) {
    return new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label,
            data,
            borderColor,
            backgroundColor,
            tension: 0.2,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true },
        },
        scales: {
          y: { beginAtZero: true },
        },
      },
    });
  }

  let activeChart = $state<
    "maxWeight"
    | "oneRepMax"
    | "setVolume"
    | "sessionVolume"
    | "sessionReps"
  >("maxWeight");

  function renderActiveChart() {
    try {
      // Destroy all chart instances
      chartDefinitions.forEach(({ instanceRef }) => {
        const chart = instanceRef(); // get current chart
        destroyChart(chart);
        instanceRef(undefined); // then clear
      });

      // Render active chart
      const activeDef = chartDefinitions.find((def) => def.id === activeChart);
      if (!activeDef) return;

      const canvas = activeDef.canvasRef();
      if (!canvas) return;

      const chart = createChart({
        canvas,
        label: activeDef.label,
        data: activeDef.data,
        borderColor: activeDef.borderColor,
        backgroundColor: activeDef.backgroundColor,
      });

      activeDef.instanceRef(chart);
    } catch (err) {
      console.error("renderActiveChart failed:", err);
    }
  }

  $effect(() => {
    renderActiveChart();
  });
</script>

<!-- TODO:
  - Implement setVolume, sessionVolume, and sessionReps charts
  - Add error handling for chart rendering?
  - Add date filter 4 weeks, 3 months, 1 year, all time
    - Filter adjusts graph data and table or just graph data?
-->

<h1>Exercise: {exerciseName.replace(/-/g, " ")}</h1>
<div class="chart-buttons">
  <button onclick={() => (activeChart = "maxWeight")}>Max Weight</button>
  <button onclick={() => (activeChart = "oneRepMax")}>1RM</button>
  <!-- You can enable these later as you implement them -->
  <button onclick={() => (activeChart = "setVolume")}>Set Volume</button>
  <button onclick={() => (activeChart = "sessionVolume")}
    >Session Volume</button
  >
  <button onclick={() => (activeChart = "sessionReps")}>Session Reps</button>
</div>
<div class="charts-wrapper">
  <div class="chart-container" style="display: {activeChart === 'maxWeight' ? 'block' : 'none'}">
    <canvas bind:this={maxWeightCanvas}></canvas>
  </div>
  <div class="chart-container" style="display: {activeChart === 'oneRepMax' ? 'block' : 'none'}">
    <canvas bind:this={oneRepMaxCanvas}></canvas>
  </div>
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

  button {
    margin-right: 0.5rem;
    padding: 0.5rem 1rem;
    font-size: 1rem;
    border: none;
    border-radius: 6px;
    background-color: #1976d2;
    color: white;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .charts-wrapper {
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
    max-width: 1280px;
    margin-bottom: 2rem;
  }

  .chart-container {
    width: 100%;
    height: 350px;
    margin-bottom: 1rem;
  }

  canvas {
    width: 100%;
    height: 100%;
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
