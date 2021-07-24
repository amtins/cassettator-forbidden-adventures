const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const videojsVersions = () => {
    return fetch('https://api.cdnjs.com/libraries/video.js?fields=versions,latest')
        .then(response => response.json())
        .then(({ versions }) => versions.filter((version) => version.startsWith('7')))
        .then(versions => versions.reverse());
}

const versionOptions = (versions = [], defaultVersion) => {
    const fragment = document.createDocumentFragment();

    versions.forEach(version => {
        const option = document.createElement('option');
        option.textContent = version;
        option.value = version;


        if (`@${version}` === defaultVersion) {
            option.selected = true
        }

        fragment.appendChild(option);

    });

    if (versions.length) {
        $('.versions').appendChild(fragment);
    }
}

const videojsCssLoader = (version) => {
    const link = document.createElement('link');
    const css = `https://unpkg.com/video.js${version}/dist/video-js.css`;

    link.rel = 'stylesheet';
    link.href = css;

    document.head.appendChild(link);
}

const videojsScriptLoader = (version, callback) => {
    const script = document.createElement('script');
    const src = `https://unpkg.com/video.js${version}/dist/video.js`;

    script.async = true;
    script.defer = 'defer';
    script.src = src;
    script.type = 'text/javascript';
    script.onload = callback;

    document.body.appendChild(script);
}

const unitedState = (key, value, reload = false) => {
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);

    window.history.pushState(null, null, url);

    if (reload) {
        window.location = url;
    }
}

const mimeTypeFinder = (mimeType) => {
    if (mimeType.match(/\.(mpd|m3u8)$/)) {
        return mimeType.endsWith('mpd') ? 'DASH' : 'HLS';
    }

    return '📼';
}

const mimeTypeSelector = (mimeType) => {
    Array
        .from($$('.resource__mime-type option'))
        .find(option => option.label === mimeTypeFinder(mimeType))
        .selected = true;
}

let player = undefined;

(async (x) => {
    const versions = await videojsVersions();
    const url = new URL(location.toString());
    const defaultVersion = url.searchParams.has('version') ? `@${url.searchParams.get('version')}` : `@${versions[0]}`;
    const mediaSource = url.searchParams.has('url') ? url.searchParams.get('url') : undefined;
    const superPowerActivation = $('audio');

    if (mediaSource) {
        $('.resource__url').value = mediaSource;
        mimeTypeSelector(mediaSource);
    }

    versionOptions(versions, defaultVersion);
    videojsCssLoader(defaultVersion);
    videojsScriptLoader(defaultVersion, () => {
        const options = {
            liveui: true,
            liveTracker: {
                trackingThreshold: 120,
                liveTolerance: 30,
            },
        };
        const source = {
            src: mediaSource ? mediaSource : 'https://wowzaec2demo.streamlock.net/live/bigbuckbunny/manifest_mpm4sav_mvtime.mpd',
            type: mediaSource ? $('.resource__mime-type').value : 'application/dash+xml'
        };

        player = new videojs('player', options);

        
        player.poster('http://lorempixel.com/640/360/abstract/');
        player.src(source);
        
        $('pre').innerText = JSON.stringify(videojs.VhsHandler.version(), null, 2);
        $('.versions').addEventListener('change', () => unitedState('version', $('.versions').value, true));
        $('.resource__url').addEventListener('input', () => mimeTypeSelector($('.resource__url').value));
        $('.resource__submit').addEventListener('click', ()=> {
            const url = $('.resource__url').value;
            
            if (url) {
                mimeTypeSelector(url);
                unitedState('url', url);

                player.src({ src: url, type: $('.resource__mime-type').value });
            }
        });
        $('.cassetator-hero').addEventListener('click', () => superPowerActivation.play());
    });
})();