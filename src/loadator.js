//https://usefulangle.com/post/343/javascript-load-multiple-script-by-order
//https://stackoverflow.com/questions/55602445/how-to-load-multiple-scripts-dynamically-in-specific-order/55602970#55602970
//https://stackoverflow.com/a/41115086

const resourceator = ({ type, url }) => {
    return new Promise((resolve, reject) => {
        const script = 'script';
        const link = 'link';
        const isScript = type === 'js';
        const el = document.createElement(isScript ? script : link);

        if (isScript) {
            el.src = url;
            el.async = false;
            el.type = 'text/javascript';
        } else {
            el.rel = 'stylesheet';
            el.href = url;
        }

        el.onload = () => resolve({ type, url });
        el.onerror = () => reject({ type, url });

        document[isScript ? 'body' : 'head'].appendChild(el);
    });
}

const loadator = async (resources) => {
    let promises = [];

    resources.forEach((resource) => {
        promises.push(resourceator(resource));
    });

    return Promise
        .allSettled(promises)
        .then((results) => {
            const fulfilled = results.filter(({ status }) => status === 'fulfilled');
            const rejected = results.filter(({ status }) => status === 'rejected');

            if (!rejected.length) {
                return Promise.resolve(fulfilled);

            }
            return Promise.reject(rejected);
        });
}

export default loadator;
