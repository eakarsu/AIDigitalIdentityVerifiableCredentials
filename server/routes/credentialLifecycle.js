const router=require('express').Router();
const pool=require('../db');
const auth=require('../middleware/auth');
const {validateIssue,assertTransition,validatePresentation}=require('../domain/credentialWorkflow');
router.use(auth);
function tenant(req){const t=req.user.tenantId||req.user.tenant_id;if(!t)throw new Error('tenant-bound identity required');return String(t);}

router.post('/offers',async(req,res)=>{try{validateIssue(req.body);if(!req.body.idempotencyKey)throw new Error('idempotencyKey required');
 const r=await pool.query(`INSERT INTO credential_lifecycles(tenant_id,subject_did,schema_uri,issuer_key_reference,consent_receipt_id,expires_at,idempotency_key,state,created_by)
 VALUES($1,$2,$3,$4,$5,$6,$7,'draft',$8) ON CONFLICT(tenant_id,idempotency_key) DO UPDATE SET idempotency_key=EXCLUDED.idempotency_key RETURNING *`,
 [tenant(req),req.body.subjectDid,req.body.schemaUri,req.body.issuerKeyReference,req.body.consentReceiptId,req.body.expiresAt,req.body.idempotencyKey,req.user.id]);res.status(201).json(r.rows[0]);
}catch(e){res.status(400).json({error:e.message});}});

router.post('/:id/transition',async(req,res)=>{const client=await pool.connect();try{await client.query('BEGIN');const c=await client.query('SELECT * FROM credential_lifecycles WHERE id=$1 AND tenant_id=$2 FOR UPDATE',[req.params.id,tenant(req)]);if(!c.rows[0]){await client.query('ROLLBACK');return res.status(404).json({error:'credential not found'});}
 assertTransition(c.rows[0].state,req.body.to,req.body);const u=await client.query(`UPDATE credential_lifecycles SET state=$1,external_signature_proof=COALESCE($2,external_signature_proof),status_list_index=COALESCE($3,status_list_index),revocation_reason=COALESCE($4,revocation_reason),updated_at=NOW() WHERE id=$5 RETURNING *`,[req.body.to,req.body.externalSignatureProof||null,req.body.statusListIndex||null,req.body.reason||null,req.params.id]);
 await client.query(`INSERT INTO credential_lifecycle_events(credential_id,actor_id,from_state,to_state,details)VALUES($1,$2,$3,$4,$5)`,[req.params.id,req.user.id,c.rows[0].state,req.body.to,req.body.details||{}]);await client.query('COMMIT');res.json(u.rows[0]);
}catch(e){await client.query('ROLLBACK');res.status(409).json({error:e.message});}finally{client.release();}});

router.post('/:id/presentations/verify',async(req,res)=>{try{validatePresentation(req.body,req.body.expectedChallenge);const c=await pool.query('SELECT * FROM credential_lifecycles WHERE id=$1 AND tenant_id=$2',[req.params.id,tenant(req)]);if(!c.rows[0])return res.status(404).json({error:'credential not found'});const valid=c.rows[0].state==='issued'&&new Date(c.rows[0].expires_at)>new Date();
 await pool.query(`INSERT INTO presentation_checks(credential_id,verifier_id,challenge,audience,consent_receipt_id,valid,details)VALUES($1,$2,$3,$4,$5,$6,$7)`,[req.params.id,req.user.id,req.body.challenge,req.body.audience,req.body.consentReceiptId,valid,{status:c.rows[0].state}]);res.json({valid,status:c.rows[0].state,signatureVerifiedExternally:Boolean(req.body.externalSignatureVerified)});
}catch(e){res.status(400).json({error:e.message});}});
module.exports=router;
