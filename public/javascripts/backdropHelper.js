let imageURL;
const ACCESS_KEY =''; // fill in your own unsplash access key

async function fetchUnsplashBackground() {
    if (imageURL) {
        return imageURL;
    }
    try {
        const response = await fetch(`https://api.unsplash.com/photos/random?query=landscape&client_id=${ACCESS_KEY}`);
        const data = await response.json();
        imageURL = data.urls.full;
        return imageURL;
    } catch (error) {
        console.error(`Hey! Looks like you don't have an Unsplash API key, we will just show a white background then.\nOr if you want you can use your own API key`, error);
        return null;
    }
}

export {
    fetchUnsplashBackground
}