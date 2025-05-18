addEventListener('message', function({ data }) {
	if (!data || data.sender != 'frhd-themes') return;
	switch (data.action) {
	case 'setColorScheme':
		setOptions(data.storage);
		break;
	case 'updateColorScheme':
		setOptions(data.storage)
	}
});

function setOptions(options) {
	// document.documentElement.style.setProperty('--bg-clr', 'red');
	document.documentElement.style.setProperty('filter', 'brightness(' + options.brightness / 100 + ')');
}

// Fix some functional buttons
document.addEventListener('DOMContentLoaded', function() {
	if (document.fullscreenEnabled) {
		const requestFullScreenHeader = document.querySelector('#header-fullscreen');
		if (requestFullScreenHeader !== null) {
			requestFullScreenHeader.removeAttribute('href');
			requestFullScreenHeader.addEventListener('click', function(event) {
				// event.stopPropagation();
				if (document.fullscreenElement) {
					document.exitFullscreen();
				} else {
					document.documentElement.requestFullscreen()
				}
			}, { passive: true });
		}
	}
});

if ('navigation' in window) {
	navigation.addEventListener('navigatesuccess', init);
}

window.addEventListener('load', init);
function init() {
	const loadMoreComments = document.querySelector('#load-more-comments');
	if (loadMoreComments !== null) {
		const trackCommentsBox = loadMoreComments.closest('.track-comments-box');
		const trackCommentsList = trackCommentsBox.querySelector('.track-comments-list');
		if (trackCommentsBox !== null && trackCommentsList !== null) {
			loadMoreComments.addEventListener('click', function() {
				new MutationObserver(function(mutations, observer) {
					const addedNodeMutations = mutations.filter(({ addedNodes }) => addedNodes.length > 0);
					if (addedNodeMutations.length > 0) {
						observer.disconnect();
						trackCommentsBox.scrollIntoView({
							behavior: 'smooth',
							block: 'end'
						})
					}
				}).observe(trackCommentsList, { childList: true })
			}, { passive: true });
		}
	}
}