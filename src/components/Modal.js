

const ModalBackground = (props)=>{
    const {cancelHandler} = props;
return (
    <div className="modal-background" onClick={()=>{cancelHandler()}}>
    </div>
    )
}

const Modal = (props)=>{
    const{acceptHandler,cancelHandler,modalText,classNames}= props;
    const closeModelHandler = cancelHandler;
    return(
        <>
            <ModalBackground cancelHandler={cancelHandler}/>
            <div className={`modal ${classNames}`}>
                <p>{modalText}</p>
                <button onClick={()=>{acceptHandler(); closeModelHandler()}}>Accept</button>
                <button onClick={()=>{cancelHandler()}}>Cancel</button>
            </div>    
        </>
    )
}

export default Modal;