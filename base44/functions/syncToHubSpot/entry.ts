import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customer_id } = await req.json();

    if (!customer_id) {
      return Response.json({ error: 'customer_id is required' }, { status: 400 });
    }

    // Get customer data
    const customers = await base44.entities.Customer.filter({ id: customer_id });
    const customer = customers[0];

    if (!customer) {
      return Response.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Get CRM integration settings
    const integrations = await base44.entities.CRMIntegration.filter({
      restaurant_id: user.restaurant_id,
      crm_type: 'hubspot'
    });
    const integration = integrations[0];

    if (!integration || !integration.is_connected) {
      return Response.json({ error: 'HubSpot not connected' }, { status: 400 });
    }

    // Get OAuth access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('hubspot');

    // Prepare contact data based on sync fields
    const syncFields = integration.sync_fields || {};
    const properties = {};

    // Email is required for HubSpot contacts
    if (!customer.email && !customer.phone) {
      return Response.json({ 
        error: 'Customer must have either email or phone number',
        customer_id 
      }, { status: 400 });
    }

    if (syncFields.full_name && customer.full_name) {
      const nameParts = customer.full_name.split(' ');
      if (nameParts[0]) properties.firstname = nameParts[0];
      if (nameParts.length > 1) properties.lastname = nameParts.slice(1).join(' ');
    }
    if (syncFields.email && customer.email) {
      properties.email = customer.email;
    }
    if (syncFields.phone && customer.phone) {
      properties.phone = customer.phone;
    }
    if (syncFields.city && customer.city) {
      properties.city = customer.city;
    }
    if (syncFields.address && customer.address) {
      properties.address = customer.address;
    }
    if (syncFields.source && customer.source) {
      properties.signup_source = customer.source;
    }
    if (syncFields.referred_by && customer.referred_by) {
      properties.referrer_id = customer.referred_by;
    }

    // Ensure we have at least some data to sync
    if (Object.keys(properties).length === 0) {
      return Response.json({ 
        error: 'No fields selected for sync',
        customer_id 
      }, { status: 400 });
    }

    // Create or update contact in HubSpot
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ properties })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('HubSpot API error:', errorData);
      return Response.json({ 
        error: 'Failed to sync to HubSpot',
        details: errorData 
      }, { status: response.status });
    }

    const hubspotContact = await response.json();

    // Update last sync date
    await base44.asServiceRole.entities.CRMIntegration.update(integration.id, {
      last_sync_date: new Date().toISOString()
    });

    return Response.json({
      success: true,
      hubspot_contact_id: hubspotContact.id,
      message: 'Customer synced to HubSpot successfully'
    });

  } catch (error) {
    console.error('Error syncing to HubSpot:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});