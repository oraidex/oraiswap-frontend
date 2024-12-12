import React from "react";
import styles from "./index.module.scss";
import cn from 'classnames/bind';

const cx = cn.bind(styles);

const ImageInput = ({ }) => {
    const [dragActive, setDragActive] = React.useState(false);
    const [imageUrl, setImageUrl] = React.useState('');
    const inputRef = React.useRef(null);

    const handleDrag = function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = function (e) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            // handleFiles(e.dataTransfer.files);

        }
    };

    const handleChange = function (e) {
        console.log("change", e.target.files)
        e.preventDefault();

        if (e.target.files && e.target.files[0]) {
            // handleFiles(e.target.files);
            console.log(e.target.files[0]);
            setImageUrl(URL.createObjectURL(e.target.files[0]));
        }
    };

    const onButtonClick = () => {
        inputRef.current.click();
    };

    return (
        <form className="form-file-upload" onDragEnter={handleDrag} onSubmit={(e) => e.preventDefault()}>
            <input ref={inputRef} type="file" className="input-file-upload" multiple={true} onChange={handleChange} />
            <label className={cx("label-file-upload", dragActive ? "drag-active" : "")} htmlFor="input-file-upload">
                <div>
                    {/* <p>Drag and drop your file here or</p>
                    <button className="upload-button" onClick={onButtonClick}>Upload a file</button> */}
                </div>
                <div>
                    <img src={imageUrl} alt="preview picture" width={150} height={150} />
                </div>
            </label>
            {dragActive && <div className="drag-file-element" onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}></div>}
        </form>
    );
}

export default ImageInput;