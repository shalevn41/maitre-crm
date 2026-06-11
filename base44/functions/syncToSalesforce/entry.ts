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
      crm_type: 'salesforce'
    });
    const integration = integrations[0];

    if (!integration || !integration.is_connected) {
      return Response.json({ error: 'Salesforce not connected' }, { status: 400 });
    }

    // Get OAuth access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('salesforce');

    // Get Salesforce instance URL from connection details
    const instanceUrl = integration.connection_details?.instance_url || 'https://login.salesforce.com';

    // Prepare contact data based on sync fields
    const syncFields = integration.sync_fields || {};
    const contactData = {};

    // LastName is required in Salesforce
    if (syncFields.full_name && customer.full_name) {
      const nameParts = customer.full_name.split(' ');
      contactData.FirstName = nameParts[0] || '';
      contactData.LastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : nameParts[0];
    } else {
      contactData.LastName = customer.full_name || 'Customer';
    }

    if (syncFields.email && customer.email) {
      contactData.Email = customer.email;
    }
    if (syncFields.phone && customer.phone) {
      contactData.Phone = customer.phone;
    }
    if (syncFields.city && customer.city) {
      contactData.MailingCity = customer.city;
    }
    if (syncFields.address && customer.address) {
      contactData.MailingStreet = customer.address;
    }
    if (syncFields.source && customer.source) {
      contactData.LeadSource = customer.source;
    }

    // Ensure LastName is always set (Salesforce requirement)
    if (!contactData.LastName) {
      contactData.LastName = 'Customer';
    }

    // Create contact in Salesforce
    const response = await fetch(`${instanceUrl}/services/data/v58.0/sobjects/Contact`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contactData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Salesforce API error:', errorData);
      return Response.json({ 
        error: 'Failed to sync to Salesforce',
        details: errorData 
      }, { status: response.status });
    }

    const salesforceContact = await response.json();

    // Update last sync date
    await base44.asServiceRole.entities.CRMIntegration.update(integration.id, {
      last_sync_date: new Date().toISOString()
    });

    return Response.json({
      success: true,
      salesforce_contact_id: salesforceContact.id,
      message: 'Customer synced to Salesforce successfully'
    });

  } catch (error) {
    console.error('Error syncing to Salesforce:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});