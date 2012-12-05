(function($) {

Galleria.addTheme({
	name: 'hackathon9',
	author: 'Yelp',
	css: false, // we load the CSS manually in manifest.json
	defaults: {
		transition: false,
		thumbCrop: 'height',
		imageCrop: false,
		maxScaleRatio: 1,
		layerFollow: false,
		showInfo: false,
		showCounter: false,
		//thumbnails: 'lazy',

		// custom options
		_collectionName: 'Photos',
		_maxThumbs: 3
	},
	init: function(options) {

		Galleria.requires(1.28, 'This theme requires Galleria 1.2.8 or later')

		// keyboard events
		this.attachKeyboard({
			right: this.next,
			left: this.prev
		})

		// lightbox title
		this.addElement('collection-info')
		this.$('collection-info').text( options._collectionName )
		this.appendChild('container', 'collection-info')

		// photo actions below thumbnails
		this.addElement('thumb-links')
		this.appendChild('thumbnails-container', 'thumb-links')

		// toggle more/less link
		this.addElement('more-link')

		if ( this.getDataLength() > options._maxThumbs ) {

			var more = this.$('more-link'),
			    thumbs_container = this.$('thumbnails-container')

			more.html('<a class="more">▼ Show More</a><a class="less">▲ Show Less</a>')
			more.bind('click', function() {
				thumbs_container.toggleClass('expanded')
			})
			this.appendChild('thumb-links', 'more-link')
		}

		// add photos link
		this.addElement('add-photos-link')
		this.appendChild('thumb-links', 'add-photos-link')

		// fake rating widget
		this.addElement('faux-rating')
		this.$('faux-rating').html([
			'<div class="rate-photo">',
				'<h3>Rate this Photo</h3>',
				'<label for="radio1">',
					'<input id="radio1" name="rating" value="Helpful" type="radio">',
					'Very Helpful',
				'</label><br>',
				'<label for="radio2">',
					'<input id="radio2" name="rating" value="Helpful" type="radio">',
					'Helpful',
				'</label><br>',
				'<label for="radio3">',
					'<input id="radio3" name="rating" value="Not Helpful" type="radio">',
					'Not Helpful',
				'</label>',
			'</div>'
		].join(''))
		//this.appendChild('container', 'faux-rating')

		// fake ad
		this.addElement('faux-ad')
		this.$('faux-ad').text('300x250')
		this.appendChild('container', 'faux-ad')

		// idle states
		this.addIdleState( this.get('image-nav-left'), { left: -50 })
		this.addIdleState( this.get('image-nav-right'), { right: -50 })
		this.addIdleState( this.get('counter'), { opacity: 0.5 })

		// lazy load thumbs
		this.lazyLoadChunks(10)
	}
})

}(jQuery))
