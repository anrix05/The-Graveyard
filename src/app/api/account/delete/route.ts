import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser, getSupabaseAdmin } from '@/lib/supabase';

const deleteAccountSchema = z.object({
  confirmationUsername: z.string().min(1, 'Confirmation username is required.'),
});

export async function POST(req: Request) {
  try {
    // 1. Authenticate user from session token
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: authError || 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = deleteAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message || 'Invalid input.' } },
        { status: 400 }
      );
    }

    const { confirmationUsername } = parsed.data;
    const supabaseAdmin = getSupabaseAdmin();

    // 2. Fetch user's current profile to verify username match
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, username')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User profile not found.' } },
        { status: 404 }
      );
    }

    const currentCleanUsername = (profile.username || '').toLowerCase().trim().replace(/^@/, '');
    const inputCleanUsername = confirmationUsername.toLowerCase().trim().replace(/^@/, '');

    if (currentCleanUsername !== inputCleanUsername) {
      return NextResponse.json(
        {
          error: {
            code: 'USERNAME_MISMATCH',
            message: `Confirmation username "${confirmationUsername}" does not match your profile username.`,
          },
        },
        { status: 400 }
      );
    }

    const shortId = user.id.replace(/-/g, '').slice(0, 8);
    const anonymizedUsername = `deleted_${shortId}`;

    // 3. Anonymize user profile
    const { error: anonymizeError } = await supabaseAdmin
      .from('profiles')
      .update({
        username: anonymizedUsername,
        bio: null,
        avatar_url: null,
        contact_info: null,
        phone_number: null,
        upi_id: null,
      })
      .eq('id', user.id);

    if (anonymizeError) {
      console.error('Error anonymizing profile:', anonymizeError);
      return NextResponse.json(
        { error: { code: 'ANONYMIZE_FAILED', message: 'Failed to anonymize profile data.' } },
        { status: 500 }
      );
    }

    // 4. Archive all of the user's listings (does not delete sales/transactions so buyers retain their access)
    const { error: archiveError } = await supabaseAdmin
      .from('projects')
      .update({ is_archived: true })
      .eq('seller_id', user.id);

    if (archiveError) {
      console.error('Error archiving user listings:', archiveError);
    }

    // 5. Disable the auth user via admin API so they cannot sign back in
    try {
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        ban_duration: '876000h', // ~100 years
        user_metadata: { deleted: true, deleted_at: new Date().toISOString() },
      });
    } catch (banError) {
      console.error('Error banning user account:', banError);
    }

    return NextResponse.json({
      success: true,
      message: 'Account deleted and anonymized successfully.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 }
    );
  }
}
