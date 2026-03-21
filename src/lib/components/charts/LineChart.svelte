<script lang="ts">
	import {
		Chart,
		LineController,
		LineElement,
		PointElement,
		LinearScale,
		CategoryScale,
		Filler,
		Tooltip,
		Legend,
		Title
	} from 'chart.js';
	import type { ChartConfiguration } from 'chart.js';

	Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend, Title);

	interface Props {
		labels: string[];
		datasets: Array<{
			label: string;
			data: (number | null)[];
			borderColor: string;
			backgroundColor: string;
			spanGaps?: boolean;
		}>;
		title?: string;
		yAxisBeginAtZero?: boolean;
		class?: string;
	}

	let {
		labels,
		datasets,
		title,
		yAxisBeginAtZero = true,
		class: className = ''
	}: Props = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart | undefined;

	const buildChart = (currentLabels: string[], currentDatasets: typeof datasets) => {
		if (!canvas) return;

		if (chart) {
			chart.destroy();
		}

		const config: ChartConfiguration = {
			type: 'line',
			data: {
				labels: currentLabels,
				datasets: currentDatasets.map(ds => ({
					...ds,
					tension: 0.2,
					fill: true,
					clip: false,
					pointRadius: 4,
					pointHoverRadius: 6
				}))
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: true,
						labels: {
							color: 'rgb(156, 163, 175)'
						}
					},
					title: title
						? {
								display: true,
								text: title,
								color: 'rgb(156, 163, 175)'
						  }
						: undefined
				},
				scales: {
					y: {
						beginAtZero: yAxisBeginAtZero,
						grace: '10%',
						ticks: {
							color: 'rgb(156, 163, 175)'
						},
						grid: {
							color: 'rgba(156, 163, 175, 0.1)'
						}
					},
					x: {
						ticks: {
							color: 'rgb(156, 163, 175)'
						},
						grid: {
							color: 'rgba(156, 163, 175, 0.1)'
						}
					}
				}
			}
		};

		chart = new Chart(canvas, config);
	}

	$effect(() => {
		// Capture current values to pass into buildChart so it reads reactive props
		const currentLabels = labels;
		const currentDatasets = datasets;

		if (canvas?.offsetWidth > 0) {
			// Canvas already has real dimensions — build immediately.
			buildChart(currentLabels, currentDatasets);
			return () => {
				chart?.destroy();
				chart = undefined;
			};
		}

		// Canvas not yet visible (e.g. inside an inactive tab panel).
		// Wait until it gets real dimensions before building.
		const observer = new ResizeObserver(() => {
			if (canvas && canvas.offsetWidth > 0) {
				buildChart(currentLabels, currentDatasets);
				observer.disconnect();
			}
		});
		if (canvas) observer.observe(canvas);

		return () => {
			observer.disconnect();
			chart?.destroy();
			chart = undefined;
		};
	});
</script>

<div class="w-full h-full {className}">
	<canvas bind:this={canvas} class="w-full h-full"></canvas>
</div>
