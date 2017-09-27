Ext.namespace('Zarafa.plugins.intranetproxy');

/**
 * @class Zarafa.plugins.intranetproxy.IntranetProxy
 * @extends Zarafa.core.Plugin
 *
 * Plugin that makes it possible to change the styling of the WebApp
 */
Zarafa.plugins.intranetproxy.IntranetProxy = Ext.extend(Zarafa.core.Plugin, {

	/**
	 * Initializes the plugin.
	 */
	initPlugin : function(){
		var pluginSettings = container.getSettingsModel().get('zarafa/v1/plugins/intranetproxy', true);
		var sites = [{
			buttonText: pluginSettings['button-title'],
			url: pluginSettings['url'],
			tabOrder: 15
		}];
		var i=1;
		while ( Ext.isDefined(pluginSettings['url-' + i]) ){
			sites.push({
				buttonText: pluginSettings['button-title-'+i],
				url: pluginSettings['url-'+i],
				tabOrder: 15 + i
			});
			i++;
		}

		Ext.each(sites, function(site, i){
			// The tab in the top tabbar
			this.registerInsertionPoint('main.maintabbar.left', this.createMainTab.createDelegate(this, [site]), this);
		}, this);

		// Register mail specific dialog types
		Zarafa.core.data.SharedComponentType.addProperty('plugins.intranetproxy.panel');
	},

	/**
	 * Adds a button to the top tab bar for this context.
	 * @return {Object} The button for the top tabbar
	 * @private
	 */
	createMainTab: function(site)
	{
		return {
			text: site.buttonText,
			url: site.url,
			tabOrderIndex: site.tabOrder,
			cls: 'mainmenu-button-intranet',
			handler: this.openTab
		};
	},

	/**
	 * Event handler for the click event of the tabbar buttons. It will
	 * open the tab if it already exists, or create it otherwise.
	 * @param {Zarafa.core.ui.MainTab} btn The button in the
	 * {@link Zarafa.core.ui.MainTabBar main tabbar}
	 */
	openTab: function(btn)
	{
		var tabIndex;
		Ext.each(container.getTabPanel().items.items, function(item, index){
			if ( item.url===btn.url && item.title===btn.text ){
				tabIndex = index;
			}
		});

		if ( Ext.isDefined(tabIndex) ){
			// open the existing tab
			var mainContentTabPanel = container.getMainPanel().contentPanel;
			mainContentTabPanel.activate(tabIndex);

		} else {
			// Create a new tab
			Zarafa.core.data.UIFactory.openLayerComponent(
				Zarafa.core.data.SharedComponentType['plugins.intranetproxy.panel'],
				null,
				{
					url: btn.url,
					title: btn.text,
					tabOrder: btn.tabOrderIndex
				}
			);
		}
	},

	/**
	 * Bid for the type of shared component
	 * and the given record.
	 * This will bid on a common.dialog.create or common.dialog.view for a
	 * record with a message class set to IPM or IPM.Note.
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context
	 * can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Number} The bid for the shared component
	 */
	bidSharedComponent : function(type, record)
	{
			var bid = -1;

			switch (type) {
				case Zarafa.core.data.SharedComponentType['plugins.intranetproxy.panel']:
					bid = 1;
			}

			return bid;
	},

	/**
	 * Will return the reference to the shared component.
	 * Based on the type of component requested a component is returned.
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context
	 * can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Ext.Component} Component
	 */
	getSharedComponent : function(type, record)
	{
		var component;
		switch (type)
		{
			case Zarafa.core.data.SharedComponentType['plugins.intranetproxy.panel']:
				return Zarafa.plugins.intranetproxy.ui.ContentPanel;
		}
	}

});

Zarafa.onReady(function() {
	container.registerPlugin(new Zarafa.core.PluginMetaData({
		name : 'intranetproxy',
		displayName : _('IntranetProxy'),
		pluginConstructor : Zarafa.plugins.intranetproxy.IntranetProxy
	}));
});
Ext.namespace('Zarafa.plugins.intranetproxy.ui');

/**
 * @class Zarafa.plugins.intranetproxy.ui.ContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 */
Zarafa.plugins.intranetproxy.ui.ContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Overridden from Ext.Component
			xtype: 'zarafa.plugins.intranetproxy.ui.contentpanel',
			layout : 'fit',
			header: false,
			iconCls: 'icon_intranet',
			border: false,
			items : [{
				xtype: 'zarafa.plugins.intranetproxy.ui.panel',
				url: config.url,
				tabOrder: config.tabOrder
			}]
		});

		Zarafa.plugins.intranetproxy.ui.ContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.plugins.intranetproxy.ui.contentpanel', Zarafa.plugins.intranetproxy.ui.ContentPanel);
Ext.namespace('Zarafa.plugins.intranetproxy.ui');

/**
 * @class Zarafa.plugins.intranetproxy.ui.Panel
 * @extends Ext.Panel
 */
Zarafa.plugins.intranetproxy.ui.Panel = Ext.extend(Ext.Panel, {
	/**
	 * The id of the iframe element inside this panel
	 */
	iframeId : undefined,

	/**
	 * @cfg {Boolean} isLoadMaskShown true if load mask should be shown else false.
	 */
	isLoadMaskShown : false,

	/**
	 * The LoadMask object which will be shown when the {@link #record} is being opened, and
	 * the dialog is waiting for the server to respond with the desired data. This will only
	 * be set if {@link #showLoadMask} is true.
	 * @property
	 * @type Zarafa.common.ui.LoadMask
	 */
	loadMask : undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		this.iframeId = 'intranet-iframe-'+config.tabOrder;

		Ext.applyIf(config, {
			// Overridden from Ext.Component
			xtype: 'zarafa.plugins.intranetproxy.ui.panel',
			layout : 'fit',
			header: false,
			iconCls: 'icon_intranet',
			html : {
				tag: 'iframe',
				id: this.iframeId,
				cls: 'intranet-iframe',
				src: config.url
			},
			listeners: {
				afterrender: this.onAfterRender,
				scope: this
			}
		});

		Zarafa.plugins.intranetproxy.ui.Panel.superclass.constructor.call(this, config);
	},

	onAfterRender: function()
	{
		this.showLoadMask();
		var iframe = document.getElementById(this.iframeId);
		iframe.onload = function(){
			this.hideLoadMask();
		}.createDelegate(this);
	},

	/**
	 * If {@link #showLoadMask} is enabled, this function will display
	 * the {@link #loadMask}.
	 * @param {Boolean} errorMask True to show an error mask instead of the loading mask.
	 * @protected
	 */
	showLoadMask : function(errorMask)
	{
		if (this.isLoadMaskShown === true) {
			return;
		}
		if (!this.loadMask) {
			this.loadMask = new Zarafa.common.ui.LoadMask(this.ownerCt.el);
		}

		if (errorMask) {
			this.loadMask.showError();
		} else {
			this.loadMask.show();
			this.isLoadMaskShown = true;
		}
	},

	/**
	 * If {@link #showLoadMask} is enabled, and {@link #showLoadMask} has been
	 * called to display the {@link #loadMask} this function will disable the
	 * loadMask.
	 * @protected
	 */
	hideLoadMask : function()
	{
		if (this.isLoadMaskShown === false) {
			return;
		}

		if (this.loadMask) {
			this.loadMask.hide();
			this.isLoadMaskShown = false;
		}
	}

});

Ext.reg('zarafa.plugins.intranetproxy.ui.panel', Zarafa.plugins.intranetproxy.ui.Panel);
