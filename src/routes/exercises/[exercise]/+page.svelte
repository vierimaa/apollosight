<script lang="ts">
  import { formatDate } from "$lib/utils/format";
  import Chart from "chart.js/auto";

  const { data } = $props();
  const { exerciseName, exerciseHistory } = data;

  let maxWeightCanvas: HTMLCanvasElement;
  let oneRepMaxCanvas: HTMLCanvasElement;
  let setVolumeCanvas: HTMLCanvasElement;
  let sessionVolumeCanvas: HTMLCanvasElement;
  let sessionRepsCanvas: HTMLCanvasElement;

  let maxWeightChart: Chart | undefined;
  let oneRepMaxChart: Chart | undefined;
  let setVolumeChart: Chart;
  let sessionVolumeChart: Chart;
  let sessionRepsChart: Chart;

  interface SetEntry {
    set_index: number;
    weight_kg: number;
    reps: number;
  }

  // --- Time Range Filter ---
  let timeRange = $state<"4w" | "3m" | "6m" | "9m" | "all">("all");

  function filterByTimeRange(history: any) {
    if (timeRange === "all") return history;
    const now = new Date();
    let cutoff: Date;
    if (timeRange === "4w") {
      cutoff = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    } else if (timeRange === "3m") {
      cutoff = new Date(now);
      cutoff.setMonth(now.getMonth() - 3);
    } else if (timeRange === "6m") {
      cutoff = new Date(now);
      cutoff.setMonth(now.getMonth() - 6);
    } else if (timeRange === "9m") {
      cutoff = new Date(now);
      cutoff.setMonth(now.getMonth() - 9);
    } else {
      return history; // Should not happen, but just in case
    }
    return history.filter(
      (entry: any) => new Date(entry.workout_date) >= cutoff
    );
  }

  const filteredHistory = $derived(() => filterByTimeRange(exerciseHistory));

  // Sort history by date ascending
  const sortedHistory = $derived(() =>
    [...filteredHistory()].sort(
      (a, b) =>
        new Date(a.workout_date).getTime() - new Date(b.workout_date).getTime()
    )
  );

  // Prepare chart data
  const labels = $derived(() =>
    sortedHistory().map((entry) =>
      new Date(entry.workout_date).toLocaleDateString()
    )
  );

  const maxWeights = $derived(() =>
    sortedHistory().map((entry) =>
      Math.max(...entry.sets.map((set: SetEntry) => set.weight_kg))
    )
  );

  const oneRepMax = $derived(() =>
    sortedHistory().map((entry) =>
      Math.max(
        ...entry.sets.map(
          (set: SetEntry) => set.weight_kg * (1 + 0.0333 * set.reps)
        )
      )
    )
  );

  const setVolume = $derived(() =>
    sortedHistory().map((entry) =>
      Math.max(...entry.sets.map((set: SetEntry) => set.weight_kg * set.reps))
    )
  );

  const sessionVolume = $derived(() =>
    sortedHistory().map((entry) =>
      entry.sets.reduce(
        (total: number, set: SetEntry) => total + set.weight_kg * set.reps,
        0
      )
    )
  );

  const sessionReps = $derived(() =>
    sortedHistory().map((entry) =>
      entry.sets.reduce((total: number, set: SetEntry) => total + set.reps, 0)
    )
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
      data: () => maxWeights(),
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
      data: () => oneRepMax(),
      borderColor: "#4caf50",
      backgroundColor: "rgba(76, 175, 80, 0.2)",
    },
    {
      id: "setVolume",
      canvasRef: () => setVolumeCanvas,
      instanceRef: (chart?: Chart) => {
        if (chart !== undefined) setVolumeChart = chart;
        return setVolumeChart;
      },
      label: "Set Volume (kg*reps)",
      data: () => setVolume(),
      borderColor: "#ff9800",
      backgroundColor: "rgba(255, 152, 0, 0.2)",
    },
    {
      id: "sessionVolume",
      canvasRef: () => sessionVolumeCanvas,
      instanceRef: (chart?: Chart) => {
        if (chart !== undefined) sessionVolumeChart = chart;
        return sessionVolumeChart;
      },
      label: "Session Volume (kg*reps)",
      data: () => sessionVolume(),
      borderColor: "#9c27b0",
      backgroundColor: "rgba(156, 39, 176, 0.2)",
    },
    {
      id: "sessionReps",
      canvasRef: () => sessionRepsCanvas,
      instanceRef: (chart?: Chart) => {
        if (chart !== undefined) sessionRepsChart = chart;
        return sessionRepsChart;
      },
      label: "Session Reps",
      data: () => sessionReps(),
      borderColor: "#f44336",
      backgroundColor: "rgba(244, 67, 54, 0.2)",
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
        labels: labels(),
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
    "maxWeight" | "oneRepMax" | "setVolume" | "sessionVolume" | "sessionReps"
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
        data: activeDef.data(),
        borderColor: activeDef.borderColor,
        backgroundColor: activeDef.backgroundColor,
      });

      activeDef.instanceRef(chart);
    } catch (err) {
      console.error("renderActiveChart failed:", err);
    }
  }

  function prettifyExerciseName(slug: string) {
    return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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
<div class="center-content">
  <h1>Exercise: {prettifyExerciseName(exerciseName)}</h1>
  <div class="chart-buttons">
    <button onclick={() => (activeChart = "maxWeight")}>Max Weight</button>
    <button onclick={() => (activeChart = "oneRepMax")}>1RM</button>
    <!-- You can enable these later as you implement them -->
    <button onclick={() => (activeChart = "setVolume")}>Set Volume</button>
    <button onclick={() => (activeChart = "sessionVolume")}>Session Volume</button
    >
    <button onclick={() => (activeChart = "sessionReps")}>Session Reps</button>
  </div>
  <div class="charts-wrapper">
    <div
      class="chart-container"
      style="display: {activeChart === 'maxWeight' ? 'block' : 'none'}"
    >
      <canvas bind:this={maxWeightCanvas}></canvas>
    </div>
    <div
      class="chart-container"
      style="display: {activeChart === 'oneRepMax' ? 'block' : 'none'}"
    >
      <canvas bind:this={oneRepMaxCanvas}></canvas>
    </div>
    <div
      class="chart-container"
      style="display: {activeChart === 'setVolume' ? 'block' : 'none'}"
    >
      <canvas bind:this={setVolumeCanvas}></canvas>
    </div>
    <div
      class="chart-container"
      style="display: {activeChart === 'sessionVolume' ? 'block' : 'none'}"
    >
      <canvas bind:this={sessionVolumeCanvas}></canvas>
    </div>
    <div
      class="chart-container"
      style="display: {activeChart === 'sessionReps' ? 'block' : 'none'}"
    >
      <canvas bind:this={sessionRepsCanvas}></canvas>
    </div>
  </div>

  <div class="time-range-buttons">
    <button onclick={() => (timeRange = "4w")} class:active={timeRange === "4w"}
      >4 weeks</button
    >
    <button onclick={() => (timeRange = "3m")} class:active={timeRange === "3m"}
      >3 months</button
    >
    <button onclick={() => (timeRange = "6m")} class:active={timeRange === "6m"}
      >6 months</button
    >
    <button onclick={() => (timeRange = "9m")} class:active={timeRange === "9m"}
      >9 months</button
    >
    <button onclick={() => (timeRange = "all")} class:active={timeRange === "all"}
      >All time</button
    >
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
</div>

<style>
  .center-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .table-wrapper {
    max-width: 500px;
    width: 100%;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    background: #fafbfc;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(44, 62, 80, 0.06);
  }

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
    height: 500px;
    margin-bottom: 1rem;
    margin-top: 1rem;
  }

  canvas {
    width: 100%;
    height: 100%;
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
