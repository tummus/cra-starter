import { Route, Routes as RoutesImport } from "react-router-dom";
import MintPage from "components/pages/MintPage";

// TODO: figure out how to set page titles
export default function Routes(): JSX.Element {
  return (
    <RoutesImport>
      <Route path="/mint" element={<MintPage />} />
    </RoutesImport>
  );
}
