import Papa from 'papaparse';

// Load CSV data using event.fetch
export async function load({ fetch }) {
  const response = await fetch('/workouts.csv'); // Relative URL with event.fetch
  const csvText = await response.text();

  // Parse CSV data
  const parsedData = Papa.parse(csvText, {
    header: true
  });

  // console.log(parsedData.data)

  const foo = parsedData.data

// foo.map(bar => console.log(bar.exercise_title))

  return {
    csvData: parsedData.data // Return data for page load
  };
}
