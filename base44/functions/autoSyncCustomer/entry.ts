import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { customer_id, restaurant_id } = await req.json();

    if (!customer_id || !restaurant_id) {
      return Response.json({ error: 'customer_id and restaurant_id are required' }, { status: 400 });
    }

    // Get all active CRM integrations for this restaurant
    const integrations = await base44.asServiceRole.entities.CRMIntegration.filter({
      restaurant_id: restaurant_id,
      is_connected: true,
      auto_sync: true
    });

    if (integrations.length === 0) {
      return Response.json({
        success: true,
        message: 'No active CRM integrations with auto-sync enabled',
        synced_to: 0
      });
    }

    const results = [];

    // Sync to each connected CRM
    for (const integration of integrations) {
      try {
        let syncResult;
        
        if (integration.crm_type === 'hubspot') {
          syncResult = await base44.asServiceRole.functions.invoke('syncToHubSpot', { 
            customer_id 
          });
        } else if (integration.crm_type === 'salesforce') {
          syncResult = await base44.asServiceRole.functions.invoke('syncToSalesforce', { 
            customer_id 
          });
        }

        results.push({
          crm: integration.crm_type,
          status: 'success',
          data: syncResult?.data
        });
      } catch (error) {
        console.error(`Failed to sync to ${integration.crm_type}:`, error);
        results.push({
          crm: integration.crm_type,
          status: 'error',
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      synced_to: results.filter(r => r.status === 'success').length,
      total_integrations: integrations.length,
      results
    });

  } catch (error) {
    console.error('Error in auto-sync:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});