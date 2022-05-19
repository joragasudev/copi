export const ModalBackground = (props)=>{
    const {cancelHandler} = props;
    return (<div className="modal-background" onClick={()=>{cancelHandler()}}></div>);
}

const Modal = (props)=>{
    const{acceptHandler,cancelHandler,modalText,classNames}= props;
    const closeModalHandler = cancelHandler;
    return(
        <>
            <ModalBackground cancelHandler={cancelHandler}/>
            <div className={`modal ${classNames}`}>
                <div className="modal__container">
                    <h1 className="modal__text ">{modalText}</h1>
                    <div className="modal__buttonsBar">
                        <button className="svgIconButton" onClick={()=>{cancelHandler()}}>
                            <img className={`svgIcon svgIcon-margin `} src="/assets/close.svg" alt="cancel" />
                        </button>
                        <button className="svgIconButton" onClick={()=>{acceptHandler(); closeModalHandler()}}>
                            <img className={`svgIcon svgIcon-margin `} src="/assets/done.svg" alt="accept" />
                        </button>
                    </div>
                </div>
            </div>    
        </>
    )
}

export const HelpModal = (props)=>{
    const{closeModalHandler,classNames}= props;
    return(
        <>
        <ModalBackground cancelHandler={closeModalHandler}/>
            <div className={`modal modalHelp ${classNames}`}>
                <div className="modal__container">
                    <div className="helpModal__textContainer">
                        <img className={`svgIcon svgIcon-margin `} src="/assets/touch.svg" alt="close" />
                        <h1 className="modal__text">Tap/Click a note to copy its content.</h1>
                    </div>
                    <div className="helpModal__textContainer">
                        <img className={`svgIcon svgIcon-margin `} src="/assets/touch_app.svg" alt="close" />
                        <h1 className="modal__text">Long Tap/Click a note to edit it.</h1>
                    </div>

                    <div className="modal__buttonsBar modal__buttonBar--center">
                        <button className="svgIconButton" onClick={()=>{closeModalHandler()}}>
                            <img className={`svgIcon svgIcon-margin `} src="/assets/done.svg" alt="close" />
                        </button>
                    </div>

                </div>
            </div>    
        </>
    )
}

export default Modal;