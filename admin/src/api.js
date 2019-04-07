const SERVER_URL = process.env.REACT_APP_SERVER_URL;
const API_KEY = process.env.REACT_APP_API_TOKEN;

const headers = {
  Authorization: `Bearer ${API_KEY}`
}

export const getSchedules = () => {
  return fetch(`${SERVER_URL}/api/schedules`, {
    headers
  })
  .then(res => res.json())
  .then(({ error, schedules }) => {
    if(error) throw new Error(error);
    if(schedules) return schedules;
  });

}