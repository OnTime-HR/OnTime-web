import "./App.css";
import { auth } from "./services/firebase";

function App() {

  console.log(auth);

  return (
    <div>
      <h1>Firebase Connected Successfully 🚀</h1>
    </div>
  );
}

export default App;