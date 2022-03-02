import { Context } from "./Copi";
import { useContext } from "react";
const SEARCH_DELAY_MS = 300;
let lastTimeOutID = -1;//Este deberia estar como un useState dentro del Componente?

const SearchBar = () =>{
    const {toggleSidePanel,setSearchTerm} = useContext(Context);

    const delayedSetSearchTerm = (e)=>{
        clearTimeout(lastTimeOutID);
        lastTimeOutID = setTimeout(() => {
            //TODO Se puede hacer con useEffect esto? combiene?
            setSearchTerm(e.target.value);
        }, SEARCH_DELAY_MS);    
    }

    return (
        <div> 
            <button onClick={()=>{toggleSidePanel()}}>SP</button>
            <input id="search2" type='text' name='search' onChange={(e)=>{delayedSetSearchTerm(e)}}/>
            Search
        </div>
    )
}

export default SearchBar;