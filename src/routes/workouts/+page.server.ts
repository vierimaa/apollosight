
// Load JSON data using event.fetch
export async function load({ fetch }) {
  const response = await fetch('/static/workoutData.json'); // Relative URL with event.fetch
  const jsonData = await response.json();
  
  // // Using sessionData directly
  // const response2 = await fetch('/static/sessionData.json');
  // const jsonData2 = await response2.json();
  // console.log(jsonData2[1])

  // Function to group workouts by uuid
  interface Workout {
    uuid: string;
    [key: string]: any;
  }

  // const groupBy = (array: Workout[], key: string): { [key: string]: Workout[] } => {
  //   return array.reduce((result: { [key: string]: Workout[] }, currentValue: Workout) => {
  //     (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
  //     return result;
  //   }, {});
  // };

  const groupBy = (array: Workout[], key: string): { key: string, values: Workout[] }[] => {
    const grouped = array.reduce((result: { [key: string]: Workout[] }, currentValue: Workout) => {
      (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
      return result;
    }, {});

    return Object.entries(grouped).map(([key, values]) => ({ key, values }));
  };

  return {
    jsonData: jsonData, // Return data for page load
    sessionData: groupBy(jsonData, 'start_time') // Return grouped data for session load
  };
}
