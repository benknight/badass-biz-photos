(function($) {

// require jQuery & Galleria
if ( ! window.jQuery || ! window.Galleria ) {
	return false
}

// tell me what page I'm on
var is_biz = !! window.location.pathname.match('/biz/')
var is_biz_photos = !! window.location.pathname.match('/biz_photos')
var is_user_photos = !! window.location.pathname.match('/user_photos')

/**
 * Utility Functions
 */

// convert a photo URI to a different size
function convertPhotoURI(photo_uri, to_size) {
	var re = /\/(o|l|m|s|xs|ls|ms|ss|xss|30s|60s|120).jpg/
	return photo_uri.replace(re, '/' + to_size + '.jpg')
}

// get the collection name based on page
function getCollectionName() {
	if ( is_biz ) {
		return $('h1').text()
	}
	if ( is_biz_photos ) {
		return $('h2 a').text().replace(':', '')
	}
	if ( is_user_photos ) {
		return $('h2').text()
	}
}

function get_biz_id_from_url(url, re) {
		var matches = url.match(re)
		if ( matches ) {
			return matches[1]
		} else {
			return false
		}
}

function hideGallery() {
	$('#galleria').addClass('galleria-hidden')
	$('html').css('overflow', '');
}

function showGallery() {
	$('#galleria').removeClass('galleria-hidden')
	$('html').css('overflow', 'hidden');
}

/**
 * Core Extension Stuff
 */

function badassBizPhotos() {

	$('<div id="galleria" class="galleria-hidden">').appendTo('body')

	if ( is_biz_photos || is_biz ) {

		var add_photos_url, biz_id

		if ( is_biz_photos ) {

			// hide stuff
			$('.caption, #photo-nav-add').hide()
			$('#selected-photo').toggle( !! window.location.search.match('select') )

			// do grid enhancements
			enhanceGridPhotos()

			add_photos_url = $('#photo-details-header-actions a').attr('href')
		}

		if ( is_biz ) {

			// shim a div over the biz photos UIs on the biz page to hijack click
			$('<div id="biz-photos-shim">').appendTo('#slide-viewer')
			$('#biz-photos-shim, #bizPhotos img')
				.click(function(e) {
					// prevent page events
					e.stopPropagation()
					e.preventDefault()
					showGallery()
				}
			)

			// update the slideshow shim with the current galleria index
			$('#slide-viewer').bind('DOMSubtreeModified', function(e) {
				current_index = $(this).find('img:visible').prevAll('img').length
				$('#biz-photos-shim').data('galleria-index', current_index)
			})
			$('#slide-viewer #biz-photos-shim').click(function() {
				Galleria.get(0).show( $(this).data('galleria-index') )
			})

			add_photos_url = $('.add-biz-photo, #slide-viewer-add-photo').attr('href')
		}

		var re = /biz_user_photos\/([\w\-]+)\/upload/
		biz_id = get_biz_id_from_url(add_photos_url, re)

		if ( ! biz_id ) {
			throw new Error('No biz ID found on page.')
		}

		$.get(
			'http://www.yelp.com/biz_photos/' + biz_id + '/slice/0/999',
			processJSONData
		)
	}

	// handle user photos
	if ( is_user_photos ) {
		// do something different...
		return
	}

	return false
}

function processJSONData(data) {
	var imageData = []
	$.each(data.photos, function() {
		var photo = this
		imageData.push({
			thumb: convertPhotoURI(photo.uri, 'ms'),
			image: convertPhotoURI(photo.uri, 'o'),
			layer: [
				'<div class="photo-details">',
					'<img class="avatar" src="' + convertPhotoURI(photo.user.primary_photo, 'ms') +
						'" width="60" height="60" alt="Photo of ' + photo.user.display_name + '">',
					'<p class="user-display-name">',
						'<a href="' + photo.user.user_uri + '">',
							photo.user.display_name,
						'</a>',
					'</p>',
					'<p class="photo-caption">' + photo.photo_caption + '</p>',
					'<p class="time-uploaded">Uploaded ' + $.timeago( photo.time_uploaded ) + '</p>',
				'</div>'
			].join('')
		})
	})
	initGalleria(imageData)
}

// take a photo page DOM (e.g. /biz_photos or /user_photos) and process it for photos
function processDOMData(dom) {
	var imageData = []
	$('#photo-thumbnails .photo', dom).each(function(index) {
		$this = $(this)
		imageData.push({
			thumb: $this.find('img.photo-img').attr('src'),
			image: convertPhotoURI( $this.find('img.photo-img').attr('src'), 'o' ),
			title: $this.find('.caption p:first-child a'),
			description: $this.find('.caption p:nth-child(2)').text()
		})
	})
	initGalleria(imageData)
}

function enhanceGridPhotos() {
	// convert 100x100 photos to 250x250
	$('.photos img.photo-img').attr('src', function(index, attr) {

		$(this).data('galleria-index', index)
		return convertPhotoURI(attr, 'ls')

	// add click handler to grid so that it opens Galleria at the specified index
	}).click(function(e) {
		// prevent user_photos from reloading the page
		if ( is_user_photos ) {
			e.stopPropagation()
			e.preventDefault()
		}
		// open galleria and page to the photo that was clicked, preventing transition effect
		var gal = Galleria.get(0)
		gal.bind('image', function() {
			showGallery()
			gal.unbind('image')
		})
		gal.show( $(this).data('galleria-index') )
	})
}

// initiate Galleria plugin, put it on the page, and attach events.
function initGalleria(imageData) {
	// create hidden galleria div
	Galleria.run('#galleria', {
		dataSource: imageData,
		_collectionName: getCollectionName(),
		extend: function() {
			// css
			var themePath = chrome.extension.getURL('galleria/themes/hackathon9/')
			var sprite_classes = [
				'.galleria-thumb-nav-left',
				'.galleria-thumb-nav-right',
				'.galleria-info-link',
				'.galleria-info-close',
				'.galleria-image-nav-left',
				'.galleria-image-nav-right'
			].join()
			$(sprite_classes).css('background-image', 'url(' + themePath + 'classic-map.png)')

			// closing
			this.attachKeyboard({
				escape: hideGallery
			})
			this.addElement('close')
			this.$('close').text('×').click(function() {
				hideGallery()
			})
			this.appendChild('container', 'close')
		}
	})

	$('#galleria').click(function(e) {
		if ( e.target == this ) {
			hideGallery()
		}
	})
}

// do do that voodoo that you do
$(document).ready( badassBizPhotos )

}(jQuery))
