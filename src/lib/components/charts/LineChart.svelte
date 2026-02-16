<script lang="ts">
	import Chart from 'chart.js/auto';
	import type { ChartConfiguration } from 'chart.js';

	interface Props {
		labels: string[];
		datasets: Array<{
			label: string;
			data: number[];
			borderColor: string;
			backgroundColor: string;
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

	function createChart() {
		if (!canvas) return;

		// Destroy existing chart if any
		if (chart) {
			chart.destroy();
		}

		const config: ChartConfiguration = {
			type: 'line',
			data: {
				labels,
				datasets: datasets.map(ds => ({
					...ds,
					tension: 0.2,
					fill: true,
					pointRadius: 4,
					pointHoverRadius: 6
				}))
			},
			options: {
				responsive: true,
				maintainAspectRatio: true,
				plugins: {
					legend: {
						display: true,
						labels: {
							color: 'rgb(156, 163, 175)' // text-surface-400
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

	// Re-create chart when data changes
	$effect(() => {
		// Access reactive props to track dependencies
		const _ = [labels, datasets];
		createChart();

		// Cleanup on unmount
		return () => {
			if (chart) {
				chart.destroy();
			}
		};
	});
</script>

<div class="w-full {className}">
	<canvas bind:this={canvas}></canvas>
</div>
