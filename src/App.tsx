import "css/global/Global.css";

// Colors
import "css/global/colors/ColorVariables.css";
import "css/global/colors/BackgroundColorClasses.css";
import "css/global/colors/ColorClasses.css";

// Fonts
import "css/global/fonts/FontClasses.css";
import "css/global/fonts/FontVariables.css";

import Header from "./components/header/Header";
import LandingPage from "./components/pages/LandingPage";

function App() {
  return (
    <>
      <Header />
      <LandingPage />
    </>
  );
}

export default App;
