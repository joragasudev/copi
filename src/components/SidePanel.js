import { Context } from "./Copi";
import { useContext } from "react";

const SidePanel = ()=>{
    const {isSidePanelVisible, toggleSidePanel} = useContext(Context);
    return(
        <div className={`side-panel ${isSidePanelVisible?'side-panel-show' : ''}`}
            onClick={()=>{toggleSidePanel()}}
        >
            Side panel
        </div>
    );
}

export default SidePanel;