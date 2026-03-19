<script lang="ts">
	import {
		Chart,
		BarController,
		BarElement,
		LinearScale,
		CategoryScale,
		Tooltip,
		Legend,
		Title
	} from 'chart.js';
	import type { ChartConfiguration } from 'chart.js';

	Chart.register(BarController, BarElement, LinearScale, CategoryScale, Tooltip, Legend, Title);

	interface Props {
		labels: string[];
		datasets: Array<{
			label: string;
			data: number[];
			backgroundColor: string;
			borderColor?: string;
		}>;
		title?: string;
		yAxisBeginAtZero?: boolean;
		/** Unit suffix appended to tooltip values, e.g. "kcal" or "g". */
		tooltipUnit?: string;
		/** Stack all datasets on top of each other. */
		stacked?: boolean;
		class?: string;
	}

	let {
		labels,
		datasets,
		title,
		yAxisBeginAtZero = true,
		tooltipUnit = '',
		stacked = false,
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
			type: 'bar',
			data: {
				labels: currentLabels,
				datasets: currentDatasets.map((ds) => ({
					...ds,
					borderWidth: 1,
					borderRadius: 4,
					borderSkipped: false
				}))
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: {
					mode: 'index',
					intersect: false
				},
				plugins: {
					legend: {
						display: currentDatasets.length > 1,
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
						: undefined,
					tooltip: tooltipUnit
						? {
								callbacks: {
									label: (ctx) => {
										const raw = ctx.parsed.y;
										const formatted = raw.toLocaleString('fi-FI');
										return ` ${ctx.dataset.label}: ${formatted} ${tooltipUnit}`;
									}
								}
							}
						: undefined
				},
				scales: {
					y: {
						stacked: stacked,
						beginAtZero: yAxisBeginAtZero,
						ticks: {
							color: 'rgb(156, 163, 175)'
						},
						grid: {
							color: 'rgba(156, 163, 175, 0.18)'
						}
					},
					x: {
						stacked: stacked,
						ticks: {
							color: 'rgb(156, 163, 175)',
							maxRotation: 45,
							minRotation: 0,
							maxTicksLimit: 14
						},
						grid: {
							color: 'rgba(156, 163, 175, 0.07)'
						}
					}
				}
			}
		};

		chart = new Chart(canvas, config);
	};

	$effect(() => {
		const currentLabels = labels;
		const currentDatasets = datasets;

		if (canvas?.offsetWidth > 0) {
			buildChart(currentLabels, currentDatasets);
			return () => {
				chart?.destroy();
				chart = undefined;
			};
		}

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

<div class="relative h-64 w-full {className}">
	<canvas bind:this={canvas}></canvas>
</div>
