import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface StatsChartsProps {
	topicsPlayed: Record<string, number>;
	difficultyStats: Record<string, { correct: number; total: number }>;
}

export default function StatsCharts({ topicsPlayed, difficultyStats }: StatsChartsProps) {
	const topicChartData = {
		labels: Object.keys(topicsPlayed),
		datasets: [
			{
				label: 'Questions Played',
				data: Object.values(topicsPlayed),
				backgroundColor: 'rgba(102, 126, 234, 0.6)',
				borderColor: 'rgb(102, 126, 234)',
				borderWidth: 1,
			},
		],
	};

	const difficultyChartData = {
		labels: Object.keys(difficultyStats),
		datasets: [
			{
				data: Object.values(difficultyStats).map((stats) =>
					stats.total === 0 ? 0 : (stats.correct / stats.total) * 100
				),
				backgroundColor: ['rgba(72, 187, 120, 0.6)', 'rgba(237, 137, 54, 0.6)', 'rgba(229, 62, 62, 0.6)'],
				borderColor: ['rgb(72, 187, 120)', 'rgb(237, 137, 54)', 'rgb(229, 62, 62)'],
				borderWidth: 1,
			},
		],
	};

	const chartOptions = {
		responsive: true,
		plugins: {
			legend: {
				position: 'top' as const,
				labels: {
					color: 'white',
				},
			},
			title: {
				display: true,
				color: 'white',
			},
		},
		scales: {
			y: {
				ticks: {
					color: 'white',
				},
				grid: {
					color: 'rgba(255, 255, 255, 0.1)',
				},
			},
			x: {
				ticks: {
					color: 'white',
				},
				grid: {
					color: 'rgba(255, 255, 255, 0.1)',
				},
			},
		},
	};

	const doughnutOptions = {
		responsive: true,
		plugins: {
			legend: {
				position: 'top' as const,
				labels: {
					color: 'white',
				},
			},
		},
	};

	return (
		<div className='grid grid-cols-1 lg:grid-cols-3 gap-4 mt-2'>
			<div className='lg:col-span-2'>
				<div className='bg-gray-800 text-white rounded-lg border border-gray-700'>
					<div className='p-6'>
						<h5 className='text-xl font-semibold mb-4'>Topics Distribution</h5>
						<Bar data={topicChartData} options={chartOptions} />
					</div>
				</div>
			</div>
			<div className='lg:col-span-1'>
				<div className='bg-gray-800 text-white rounded-lg border border-gray-700'>
					<div className='p-6'>
						<h5 className='text-xl font-semibold mb-4'>Success Rate by Difficulty</h5>
						<Doughnut data={difficultyChartData} options={doughnutOptions} />
					</div>
				</div>
			</div>
		</div>
	);
}
