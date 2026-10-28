import { useState } from "react";
import showPswdIcon from "../assets/showPswdIcon.png"
import hidePswdIcon from "../assets/hidePswdIcon.png"
import Icon from "./Icon";

type UserInfoProfileSectionProps = {
    name: string;
    username: string;
    email: string;
    password: string;
}

export default function UserInfoProfileSection({name, username, email, password}: UserInfoProfileSectionProps) {
    const [showPswd, setShowPswd] = useState(false);

    function togglePasswordVisibility() {
        setShowPswd(!showPswd);
    }
    
    return (
        <div className="profile-information-box edit-profile-box general-text">

            {/* Add fucntionality later: https://www.google.com/search?q=how+to+have+an+input+box+have+a+stored+value+but+also+be+able+to+chnage+and+save+it+using+tsx+and+react&sca_esv=aafa6ca6a126c165&sxsrf=APpeQnuxriGsfUObYBCRRN30drBnyDatCQ%3A1793139481101&ei=GSPharrmBbHCp84Pvuvi6Qc&biw=901&bih=906&uact=5&oq=how+to+have+an+input+box+have+a+stored+value+but+also+be+able+to+chnage+and+save+it+using+tsx+and+react&gs_lp=Egxnd3Mtd2l6LXNlcnAiZ2hvdyB0byBoYXZlIGFuIGlucHV0IGJveCBoYXZlIGEgc3RvcmVkIHZhbHVlIGJ1dCBhbHNvIGJlIGFibGUgdG8gY2huYWdlIGFuZCBzYXZlIGl0IHVzaW5nIHRzeCBhbmQgcmVhY3RI9Z0BUO4FWNyYAXACeAGQAQCYAYgBoAGlM6oBBTU5LjE4uAEDyAEA-AEBmAI-oAKCLagCCsICBxAjGOoCGCfCAhAQIxjwBRieBhiiBxjqAhgnwgIEECMYJ8ICDRAjGPAFGJ4GGKIHGCfCAg0QABiABBiKBRhDGLQHwgIKEAAYgAQYigUYQ8ICDRAjGKIHGJ4GGPAFGCfCAg4QABiABBiKBRixAxiDAcICDhAAGIAEGIoFGJECGLQHwgIOEAAYgAQYigUYsQMYtAfCAggQABiABBi0B8ICCBAAGIAEGLEDwgIFEAAYgATCAgYQABgWGB7CAgsQABiABBiKBRiGA8ICCBAAGIkFGKIEwgIIEAAYgAQYogTCAgcQIRgKGKABwgIFECEYqwLCAgUQIRigAcICCBAAGBYYHhgKwgIFECEYnwWYAwnxBaRe83CBCB6NkgcFMzkuMjOgB7j1A7IHBTM3LjIzuAfyLMIHCTEuMTMuNDUuM8gH-AGACAE&sclient=gws-wiz-serp */}
            
            <div className="edit-profile-box-item">
                <label htmlFor="name"><strong>Name: </strong></label>
                <input type="text" id="name" name="name" value={name}/>
            </div>

            <div className="edit-profile-box-item">
                <label htmlFor="name"><strong>Username: </strong></label>
                <input type="text" id="username" name="username" value={username}/>
            </div>

            <div className="edit-profile-box-item">
                <label htmlFor="name"><strong>Email: </strong></label>
                <input type="text" id="email" name="email" value={email}/>
            </div>

            <div className="edit-profile-box-item">
                <label htmlFor="name"><strong>Password: </strong></label>
                <input type="text" id="password" name="password" value={showPswd ? password : "*".repeat(password.length)} />
                
                <button type="button" className="password-toggle" onClick={togglePasswordVisibility}>
                    <Icon src={showPswd ? hidePswdIcon : showPswdIcon} height={20} width={20} />
                </button>
            </div>
            

        </div>

    )
}