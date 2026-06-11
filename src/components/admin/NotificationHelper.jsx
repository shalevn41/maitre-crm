import { base44 } from '@/api/base44Client';

/**
 * Helper function to send admin notifications
 */
export async function sendAdminNotification(eventType, data) {
  try {
    // Get system settings
    const settings = await base44.entities.SystemSettings.list();
    if (settings.length === 0 || !settings[0].notification_emails || settings[0].notification_emails.length === 0) {
      console.log('No notification emails configured');
      return;
    }

    const systemSettings = settings[0];
    
    // Check if this event type is enabled
    const notificationMap = {
      'new_signup': systemSettings.notify_new_signup,
      'payment_failed': systemSettings.notify_payment_failed,
      'subscription_upgrade': systemSettings.notify_subscription_upgrade,
      'subscription_canceled': systemSettings.notify_subscription_canceled
    };

    if (!notificationMap[eventType]) {
      console.log(`Notifications disabled for event type: ${eventType}`);
      return;
    }

    // Prepare email content based on event type
    let subject = '';
    let body = '';

    switch (eventType) {
      case 'new_signup':
        subject = `🎉 מסעדה חדשה נרשמה: ${data.restaurant_name}`;
        body = `
          <div dir="rtl" style="font-family: Arial, sans-serif;">
            <h2>מסעדה חדשה הצטרפה לפלטפורמה</h2>
            <p><strong>שם המסעדה:</strong> ${data.restaurant_name}</p>
            <p><strong>אימייל:</strong> ${data.owner_email}</p>
            <p><strong>עיר:</strong> ${data.city || 'לא צוין'}</p>
            <p><strong>תאריך הרשמה:</strong> ${new Date().toLocaleDateString('he-IL')}</p>
          </div>
        `;
        break;

      case 'payment_failed':
        subject = `⚠️ כישלון בתשלום: ${data.restaurant_name}`;
        body = `
          <div dir="rtl" style="font-family: Arial, sans-serif;">
            <h2>תשלום נכשל</h2>
            <p><strong>מסעדה:</strong> ${data.restaurant_name}</p>
            <p><strong>אימייל:</strong> ${data.owner_email}</p>
            <p><strong>סכום:</strong> ₪${data.amount || 'לא צוין'}</p>
            <p><strong>סיבה:</strong> ${data.error_message || 'לא ידוע'}</p>
            <p><strong>זמן:</strong> ${new Date().toLocaleString('he-IL')}</p>
            <hr />
            <p style="color: #d97706;">יש ליצור קשר עם המסעדה לפתרון הבעיה.</p>
          </div>
        `;
        break;

      case 'subscription_upgrade':
        subject = `📈 ניסיון שדרוג מנוי: ${data.restaurant_name}`;
        body = `
          <div dir="rtl" style="font-family: Arial, sans-serif;">
            <h2>מסעדה מנסה לשדרג מנוי</h2>
            <p><strong>מסעדה:</strong> ${data.restaurant_name}</p>
            <p><strong>אימייל:</strong> ${data.owner_email}</p>
            <p><strong>מנוי נוכחי:</strong> ${data.current_status}</p>
            <p><strong>מנוי מבוקש:</strong> ${data.requested_status || 'active'}</p>
            <p><strong>זמן:</strong> ${new Date().toLocaleString('he-IL')}</p>
          </div>
        `;
        break;

      case 'subscription_canceled':
        subject = `❌ ביטול מנוי: ${data.restaurant_name}`;
        body = `
          <div dir="rtl" style="font-family: Arial, sans-serif;">
            <h2>מסעדה ביטלה מנוי</h2>
            <p><strong>מסעדה:</strong> ${data.restaurant_name}</p>
            <p><strong>אימייל:</strong> ${data.owner_email}</p>
            <p><strong>סיבה:</strong> ${data.reason || 'לא צוינה'}</p>
            <p><strong>זמן:</strong> ${new Date().toLocaleString('he-IL')}</p>
            <hr />
            <p style="color: #dc2626;">כדאי ליצור קשר עם המסעדה להבין את הסיבה ולנסות לשמר אותה.</p>
          </div>
        `;
        break;

      default:
        console.log(`Unknown event type: ${eventType}`);
        return;
    }

    // Send email to all configured addresses
    const emailPromises = systemSettings.notification_emails.map(email => 
      base44.integrations.Core.SendEmail({
        from_name: 'MAITRE System',
        to: email,
        subject: subject,
        body: body
      })
    );

    await Promise.all(emailPromises);
    console.log(`Notification sent successfully for event: ${eventType}`);

  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
}