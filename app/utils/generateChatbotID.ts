import crypto from "crypto"

export const generateChatbotId = () => {
    const typedArray = new Uint8Array(10);
    const randomValues = crypto.getRandomValues(typedArray);
    return randomValues.join('');
}